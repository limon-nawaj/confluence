from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.sprint import Sprint, SprintStatus, SprintTicket
from app.models.ticket import Ticket
from app.models.ticket_project import TicketProject
from app.models.user import User
from app.schemas.sprint import SprintCreate, SprintUpdate, SprintOut

router = APIRouter()


def _get_sprint_or_404(sprint_id: int, db: Session) -> Sprint:
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    return sprint


@router.get("/", response_model=List[SprintOut])
def list_sprints(
    project_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Sprint).filter(Sprint.project_id == project_id).order_by(Sprint.created_at.desc()).all()


@router.post("/", response_model=SprintOut, status_code=status.HTTP_201_CREATED)
def create_sprint(
    body: SprintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(TicketProject).filter(TicketProject.id == body.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Ticket project not found")
    sprint = Sprint(**body.model_dump())
    db.add(sprint)
    db.commit()
    db.refresh(sprint)
    return sprint


@router.put("/{sprint_id}", response_model=SprintOut)
def update_sprint(
    sprint_id: int,
    body: SprintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sprint = _get_sprint_or_404(sprint_id, db)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(sprint, field, value)
    db.commit()
    db.refresh(sprint)
    return sprint


@router.patch("/{sprint_id}/start", response_model=SprintOut)
def start_sprint(
    sprint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sprint = _get_sprint_or_404(sprint_id, db)
    # Only one active sprint per project
    active = db.query(Sprint).filter(
        Sprint.project_id == sprint.project_id,
        Sprint.status == SprintStatus.active,
    ).first()
    if active:
        raise HTTPException(status_code=409, detail="A sprint is already active for this project")
    sprint.status = SprintStatus.active
    db.commit()
    db.refresh(sprint)
    return sprint


@router.patch("/{sprint_id}/complete", response_model=SprintOut)
def complete_sprint(
    sprint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sprint = _get_sprint_or_404(sprint_id, db)
    sprint.status = SprintStatus.completed
    db.commit()
    db.refresh(sprint)
    return sprint


@router.post("/{sprint_id}/tickets/{ticket_id}", status_code=status.HTTP_201_CREATED)
def add_ticket_to_sprint(
    sprint_id: int,
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sprint = _get_sprint_or_404(sprint_id, db)
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    existing = db.query(SprintTicket).filter(
        SprintTicket.sprint_id == sprint_id,
        SprintTicket.ticket_id == ticket_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Ticket already in sprint")
    assoc = SprintTicket(sprint_id=sprint_id, ticket_id=ticket_id)
    db.add(assoc)
    db.commit()
    return {"message": "Ticket added to sprint"}


@router.delete("/{sprint_id}/tickets/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_ticket_from_sprint(
    sprint_id: int,
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assoc = db.query(SprintTicket).filter(
        SprintTicket.sprint_id == sprint_id,
        SprintTicket.ticket_id == ticket_id,
    ).first()
    if not assoc:
        raise HTTPException(status_code=404, detail="Ticket not in sprint")
    db.delete(assoc)
    db.commit()
