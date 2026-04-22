from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, selectinload

from app.core.dependencies import get_current_user, get_db
from app.models.ticket import (
    Ticket, TicketStatus, TicketAssignee, TicketWatcher
)
from app.models.ticket_label import TicketLabel, TicketLabelAssoc
from app.models.ticket_comment import TicketComment
from app.models.ticket_link import TicketLink
from app.models.ticket_project import TicketProject
from app.models.user import User
from app.schemas.ticket import (
    TicketCreate, TicketUpdate, TicketOut, TicketDetail,
    TicketStatusUpdate, TicketCommentCreate, TicketCommentUpdate,
    TicketCommentOut, TicketLinkCreate, TicketLinkOut,
    LabelCreate, LabelOut,
)

router = APIRouter()


def _load_ticket(ticket_id: int, db: Session) -> Ticket:
    ticket = (
        db.query(Ticket)
        .options(
            selectinload(Ticket.assignees).selectinload(TicketAssignee.user),
            selectinload(Ticket.label_assocs).selectinload(TicketLabelAssoc.label),
            selectinload(Ticket.children),
            selectinload(Ticket.creator),
        )
        .filter(Ticket.id == ticket_id)
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


def _auto_key(project: TicketProject, db: Session) -> str:
    """Generate next sequential ticket key like PROJ-42."""
    project.ticket_counter += 1
    db.flush()
    return f"{project.key}-{project.ticket_counter}"


# ─────────────────────────────────────────────
# Ticket CRUD
# ─────────────────────────────────────────────

@router.get("/", response_model=List[TicketOut])
def list_tickets(
    project_id: Optional[int] = Query(None),
    status: Optional[TicketStatus] = Query(None),
    priority: Optional[str] = Query(None),
    assignee_id: Optional[int] = Query(None),
    sprint_id: Optional[int] = Query(None),
    type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Ticket)
        .options(
            selectinload(Ticket.assignees).selectinload(TicketAssignee.user),
            selectinload(Ticket.label_assocs).selectinload(TicketLabelAssoc.label),
            selectinload(Ticket.children),
            selectinload(Ticket.creator),
        )
    )
    if project_id:
        query = query.filter(Ticket.project_id == project_id)
    if status:
        query = query.filter(Ticket.status == status)
    if priority:
        query = query.filter(Ticket.priority == priority)
    if type:
        query = query.filter(Ticket.type == type)
    if search:
        query = query.filter(Ticket.title.ilike(f"%{search}%"))
    if assignee_id:
        query = query.join(TicketAssignee).filter(TicketAssignee.user_id == assignee_id)
    if sprint_id:
        from app.models.sprint import SprintTicket
        query = query.join(SprintTicket).filter(SprintTicket.sprint_id == sprint_id)

    tickets = query.order_by(Ticket.updated_at.desc()).all()
    return [TicketOut.from_orm_ticket(t) for t in tickets]


@router.post("/", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
def create_ticket(
    body: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(TicketProject).filter(TicketProject.id == body.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Ticket project not found")

    ticket_key = _auto_key(project, db)
    ticket = Ticket(
        project_id=body.project_id,
        parent_id=body.parent_id,
        ticket_key=ticket_key,
        title=body.title,
        description=body.description,
        type=body.type,
        priority=body.priority,
        story_points=body.story_points,
        due_date=body.due_date,
        created_by=current_user.id,
    )
    db.add(ticket)
    db.flush()

    # Assignees
    for uid in body.assignee_ids:
        db.add(TicketAssignee(ticket_id=ticket.id, user_id=uid))

    # Labels
    for lid in body.label_ids:
        db.add(TicketLabelAssoc(ticket_id=ticket.id, label_id=lid))

    # Sprint
    if body.sprint_id:
        from app.models.sprint import SprintTicket
        db.add(SprintTicket(sprint_id=body.sprint_id, ticket_id=ticket.id))

    # Auto-watch creator
    db.add(TicketWatcher(ticket_id=ticket.id, user_id=current_user.id))

    db.commit()
    return TicketOut.from_orm_ticket(_load_ticket(ticket.id, db))


@router.get("/{ticket_id}", response_model=TicketDetail)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = (
        db.query(Ticket)
        .options(
            selectinload(Ticket.assignees).selectinload(TicketAssignee.user),
            selectinload(Ticket.label_assocs).selectinload(TicketLabelAssoc.label),
            selectinload(Ticket.children),
            selectinload(Ticket.creator),
            selectinload(Ticket.comments).selectinload(TicketComment.author),
            selectinload(Ticket.comments).selectinload(TicketComment.replies),
            selectinload(Ticket.links_as_source),
            selectinload(Ticket.links_as_target),
            selectinload(Ticket.watchers).selectinload(TicketWatcher.user),
            selectinload(Ticket.sprint_assocs),
        )
        .filter(Ticket.id == ticket_id)
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    out = TicketDetail.from_orm_ticket(ticket)
    out.comments = [c for c in ticket.comments if c.parent_id is None]
    out.links_as_source = list(ticket.links_as_source)
    out.links_as_target = list(ticket.links_as_target)
    out.watchers = [w.user for w in ticket.watchers]
    out.sprint_ids = [sa.sprint_id for sa in ticket.sprint_assocs]
    return out


@router.put("/{ticket_id}", response_model=TicketOut)
def update_ticket(
    ticket_id: int,
    body: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = _load_ticket(ticket_id, db)

    scalar_fields = ["title", "description", "type", "priority", "story_points", "due_date", "parent_id", "created_by"]
    for field in scalar_fields:
        val = getattr(body, field, None)
        if val is not None:
            setattr(ticket, field, val)

    if body.assignee_ids is not None:
        db.query(TicketAssignee).filter(TicketAssignee.ticket_id == ticket_id).delete()
        for uid in body.assignee_ids:
            db.add(TicketAssignee(ticket_id=ticket_id, user_id=uid))

    if body.label_ids is not None:
        db.query(TicketLabelAssoc).filter(TicketLabelAssoc.ticket_id == ticket_id).delete()
        for lid in body.label_ids:
            db.add(TicketLabelAssoc(ticket_id=ticket_id, label_id=lid))

    db.commit()
    return TicketOut.from_orm_ticket(_load_ticket(ticket_id, db))


@router.patch("/{ticket_id}/status", response_model=TicketOut)
def update_ticket_status(
    ticket_id: int,
    body: TicketStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lightweight status-only update used by the Kanban board drag-and-drop."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.status = body.status
    db.commit()
    return TicketOut.from_orm_ticket(_load_ticket(ticket_id, db))


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.created_by != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(ticket)
    db.commit()


# ─────────────────────────────────────────────
# Assignees
# ─────────────────────────────────────────────

@router.post("/{ticket_id}/assignees/{user_id}", status_code=status.HTTP_201_CREATED)
def add_assignee(
    ticket_id: int, user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(TicketAssignee).filter(
        TicketAssignee.ticket_id == ticket_id, TicketAssignee.user_id == user_id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="User already assigned")
    db.add(TicketAssignee(ticket_id=ticket_id, user_id=user_id))
    db.commit()
    return {"message": "Assignee added"}


@router.delete("/{ticket_id}/assignees/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_assignee(
    ticket_id: int, user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = db.query(TicketAssignee).filter(
        TicketAssignee.ticket_id == ticket_id, TicketAssignee.user_id == user_id
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Assignee not found")
    db.delete(row)
    db.commit()


# ─────────────────────────────────────────────
# Watchers
# ─────────────────────────────────────────────

@router.post("/{ticket_id}/watch", status_code=status.HTTP_201_CREATED)
def watch_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(TicketWatcher).filter(
        TicketWatcher.ticket_id == ticket_id, TicketWatcher.user_id == current_user.id
    ).first()
    if not existing:
        db.add(TicketWatcher(ticket_id=ticket_id, user_id=current_user.id))
        db.commit()
    return {"message": "Watching"}


@router.delete("/{ticket_id}/watch", status_code=status.HTTP_204_NO_CONTENT)
def unwatch_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = db.query(TicketWatcher).filter(
        TicketWatcher.ticket_id == ticket_id, TicketWatcher.user_id == current_user.id
    ).first()
    if row:
        db.delete(row)
        db.commit()


# ─────────────────────────────────────────────
# Comments
# ─────────────────────────────────────────────

@router.get("/{ticket_id}/comments", response_model=List[TicketCommentOut])
def list_comments(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comments = (
        db.query(TicketComment)
        .options(
            selectinload(TicketComment.author),
            selectinload(TicketComment.replies).selectinload(TicketComment.author),
        )
        .filter(TicketComment.ticket_id == ticket_id, TicketComment.parent_id.is_(None))
        .order_by(TicketComment.created_at)
        .all()
    )
    return comments


@router.post("/{ticket_id}/comments", response_model=TicketCommentOut, status_code=status.HTTP_201_CREATED)
def add_comment(
    ticket_id: int,
    body: TicketCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = TicketComment(
        ticket_id=ticket_id,
        author_id=current_user.id,
        content=body.content,
        parent_id=body.parent_id,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    loaded = (
        db.query(TicketComment)
        .options(selectinload(TicketComment.author), selectinload(TicketComment.replies))
        .filter(TicketComment.id == comment.id)
        .first()
    )
    return loaded


@router.put("/{ticket_id}/comments/{comment_id}", response_model=TicketCommentOut)
def update_comment(
    ticket_id: int, comment_id: int,
    body: TicketCommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.query(TicketComment).filter(
        TicketComment.id == comment_id, TicketComment.ticket_id == ticket_id
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    comment.content = body.content
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/{ticket_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    ticket_id: int, comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.query(TicketComment).filter(
        TicketComment.id == comment_id, TicketComment.ticket_id == ticket_id
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.author_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(comment)
    db.commit()


# ─────────────────────────────────────────────
# Links
# ─────────────────────────────────────────────

@router.post("/{ticket_id}/links", response_model=TicketLinkOut, status_code=status.HTTP_201_CREATED)
def add_link(
    ticket_id: int,
    body: TicketLinkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    link = TicketLink(
        source_ticket_id=ticket_id,
        target_ticket_id=body.target_ticket_id,
        link_type=body.link_type,
        created_by=current_user.id,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


@router.delete("/links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_link(
    link_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    link = db.query(TicketLink).filter(TicketLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    db.delete(link)
    db.commit()


# ─────────────────────────────────────────────
# Labels (project-level)
# ─────────────────────────────────────────────

@router.get("/projects/{project_id}/labels", response_model=List[LabelOut])
def list_labels(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(TicketLabel).filter(TicketLabel.project_id == project_id).all()


@router.post("/projects/{project_id}/labels", response_model=LabelOut, status_code=status.HTTP_201_CREATED)
def create_label(
    project_id: int,
    body: LabelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    label = TicketLabel(project_id=project_id, **body.model_dump())
    db.add(label)
    db.commit()
    db.refresh(label)
    return label


@router.delete("/labels/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_label(
    label_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    label = db.query(TicketLabel).filter(TicketLabel.id == label_id).first()
    if not label:
        raise HTTPException(status_code=404, detail="Label not found")
    db.delete(label)
    db.commit()
