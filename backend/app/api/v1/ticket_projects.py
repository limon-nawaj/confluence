from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.dependencies import get_current_user, get_db
from app.models.ticket_project import TicketProject
from app.models.ticket import Ticket, TicketStatus
from app.models.user import User
from app.models.project_permission import ProjectPermission
from app.schemas.ticket_project import (
    TicketProjectCreate, TicketProjectUpdate, TicketProjectOut, TicketProjectDetail,
    ProjectPermissionCreate, ProjectPermissionOut
)

router = APIRouter()


def _get_project_or_404(project_identifier: str | int, db: Session) -> TicketProject:
    if isinstance(project_identifier, int) or project_identifier.isdigit():
        project = db.query(TicketProject).filter(TicketProject.id == int(project_identifier)).first()
    else:
        project = db.query(TicketProject).filter(TicketProject.key.ilike(project_identifier)).first()
        
    if not project:
        raise HTTPException(status_code=404, detail="Ticket project not found")
    return project

def _check_access(project: TicketProject, user: User, min_role: str = "member"):
    if user.role.value == "admin":
        return True
    if project.owner_id == user.id:
        return True
    
    perm = next((p for p in project.permissions if p.user_id == user.id), None)
    if not perm:
        raise HTTPException(status_code=403, detail="Not authorized to access this project")
    
    if min_role == "admin" and perm.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required for this project")
    
    return True


@router.get("/", response_model=List[TicketProjectOut])
def list_ticket_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List ticket projects the user has access to."""
    if current_user.role.value == "admin":
        return db.query(TicketProject).order_by(TicketProject.created_at.desc()).all()
    
    return db.query(TicketProject).outerjoin(ProjectPermission).filter(
        or_(
            TicketProject.owner_id == current_user.id,
            ProjectPermission.user_id == current_user.id
        )
    ).order_by(TicketProject.created_at.desc()).all()


@router.post("/", response_model=TicketProjectOut, status_code=status.HTTP_201_CREATED)
def create_ticket_project(
    body: TicketProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new ticket project."""
    existing = db.query(TicketProject).filter(
        TicketProject.key == body.key.upper()
    ).first()
    if existing:
        raise HTTPException(
            status_code=409, detail=f"Project key '{body.key}' is already in use"
        )
    data = body.model_dump()
    data["key"] = data["key"].upper()
    project = TicketProject(
        **data,
        owner_id=current_user.id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=TicketProjectDetail)
def get_ticket_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get project detail with open ticket count."""
    project = _get_project_or_404(project_id, db)
    _check_access(project, current_user, "member")
    
    open_count = db.query(Ticket).filter(
        Ticket.project_id == project.id,
        Ticket.status.notin_([TicketStatus.done, TicketStatus.cancelled])
    ).count()
    result = TicketProjectDetail.model_validate(project)
    result.open_ticket_count = open_count
    return result


@router.put("/{project_id}", response_model=TicketProjectOut)
def update_ticket_project(
    project_id: str,
    body: TicketProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a ticket project (owner or project admin only)."""
    project = _get_project_or_404(project_id, db)
    _check_access(project, current_user, "admin")
        
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a ticket project (owner or global admin only)."""
    project = _get_project_or_404(project_id, db)
    if project.owner_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Only the owner or global admin can delete this project")
    db.delete(project)
    db.commit()


# ─────────────────────────────────────────────
# Members (Permissions)
# ─────────────────────────────────────────────

@router.get("/{project_id}/members", response_model=List[ProjectPermissionOut])
def list_project_members(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_project_or_404(project_id, db)
    _check_access(project, current_user, "member")
    return project.permissions


@router.post("/{project_id}/members", response_model=ProjectPermissionOut)
def add_project_member(
    project_id: str,
    body: ProjectPermissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_project_or_404(project_id, db)
    _check_access(project, current_user, "admin")
    
    # Check if duplicate
    existing = db.query(ProjectPermission).filter(
        ProjectPermission.project_id == project.id,
        ProjectPermission.user_id == body.user_id
    ).first()
    
    if existing:
        existing.role = body.role
        db.commit()
        db.refresh(existing)
        return existing
        
    perm = ProjectPermission(
        project_id=project.id,
        user_id=body.user_id,
        role=body.role
    )
    db.add(perm)
    db.commit()
    db.refresh(perm)
    return perm


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_project_member(
    project_id: str,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_project_or_404(project_id, db)
    _check_access(project, current_user, "admin")
    
    perm = db.query(ProjectPermission).filter(
        ProjectPermission.project_id == project.id,
        ProjectPermission.user_id == user_id
    ).first()
    if not perm:
        raise HTTPException(status_code=404, detail="Member not found in project")
        
    if perm.user_id == project.owner_id:
        raise HTTPException(status_code=400, detail="Cannot remove the project owner")
        
    db.delete(perm)
    db.commit()
