from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.team import TeamCreate, TeamResponse, TeamMemberCreate, TeamMemberResponse
from app.services import team_service, user_service

router = APIRouter()

@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    data: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> object:
    return team_service.create_team(db, current_user.id, data)


@router.get("", response_model=list[TeamResponse])
def get_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list:
    return team_service.get_teams(db, current_user.id)


@router.get("/{team_id}", response_model=TeamResponse)
def get_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> object:
    team = team_service.get_team(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    # User must be a member or the owner
    is_member = any(m.user_id == current_user.id for m in team.members)
    if team.owner_id != current_user.id and not is_member:
        raise HTTPException(status_code=403, detail="You do not have access to this team")
        
    return team


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    team = team_service.get_team(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can delete this team")
    team_service.delete_team(db, team)


@router.post("/{team_id}/members", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
def add_team_member(
    team_id: int,
    data: dict, # expecting {"email": "...", "role": "member"}
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> object:
    email = data.get("email")
    role = data.get("role", "member")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    team = team_service.get_team(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    is_admin = any(m.user_id == current_user.id and m.role == "admin" for m in team.members)
    if team.owner_id != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Only team admins can add members")
        
    user_to_add = user_service.get_user_by_email(db, email)
    if not user_to_add:
        raise HTTPException(status_code=404, detail="User with that email not found")
        
    return team_service.add_team_member(db, team_id, user_to_add.id, role)


@router.patch("/{team_id}/members/{user_id}", response_model=TeamMemberResponse)
def update_team_member_role(
    team_id: int,
    user_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> object:
    role = data.get("role")
    if role not in ("member", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'member' or 'admin'")

    team = team_service.get_team(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    is_admin = any(m.user_id == current_user.id and m.role == "admin" for m in team.members)
    if team.owner_id != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Only team admins can change member roles")

    if user_id == team.owner_id:
        raise HTTPException(status_code=400, detail="Cannot change the owner's role")

    member = team_service.update_team_member_role(db, team_id, user_id, role)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return member


@router.delete("/{team_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_member(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    team = team_service.get_team(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    # Only admin can remove other users. A user can remove themselves.
    is_admin = any(m.user_id == current_user.id and m.role == "admin" for m in team.members)
    if user_id != current_user.id and team.owner_id != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Only team admins can remove other members")
    
    if user_id == team.owner_id:
        raise HTTPException(status_code=400, detail="Cannot remove the team owner")
        
    team_service.remove_team_member(db, team_id, user_id)
