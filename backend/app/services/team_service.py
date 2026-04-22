from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.team import Team, TeamMember
from app.models.user import User
from app.schemas.team import TeamCreate, TeamUpdate

def create_team(db: Session, owner_id: int, data: TeamCreate) -> Team:
    team = Team(
        name=data.name,
        description=data.description,
        owner_id=owner_id
    )
    db.add(team)
    db.flush() # To get team.id
    
    # Auto-add owner as an admin member
    member = TeamMember(
        team_id=team.id,
        user_id=owner_id,
        role="admin"
    )
    db.add(member)
    db.commit()
    db.refresh(team)
    return team

def get_teams(db: Session, user_id: int) -> list[Team]:
    """Get all teams where user is a member OR owner."""
    # Since owners are added as members initially, just checking members is enough usually, 
    # but let's be safe.
    return (
        db.query(Team)
        .join(TeamMember)
        .filter(or_(Team.owner_id == user_id, TeamMember.user_id == user_id))
        .distinct()
        .all()
    )

def get_team(db: Session, team_id: int) -> Team | None:
    return db.query(Team).filter(Team.id == team_id).first()

def update_team(db: Session, team: Team, data: TeamUpdate) -> Team:
    if data.name is not None:
        team.name = data.name
    if data.description is not None:
        team.description = data.description
    db.commit()
    db.refresh(team)
    return team

def delete_team(db: Session, team: Team) -> None:
    db.delete(team)
    db.commit()

def add_team_member(db: Session, team_id: int, user_id: int, role: str = "member") -> TeamMember:
    # Check if already a member
    existing = db.query(TeamMember).filter(TeamMember.team_id == team_id, TeamMember.user_id == user_id).first()
    if existing:
        return existing
        
    member = TeamMember(
        team_id=team_id,
        user_id=user_id,
        role=role
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member

def update_team_member_role(db: Session, team_id: int, user_id: int, role: str) -> TeamMember | None:
    member = db.query(TeamMember).filter(TeamMember.team_id == team_id, TeamMember.user_id == user_id).first()
    if not member:
        return None
    member.role = role
    db.commit()
    db.refresh(member)
    return member

def remove_team_member(db: Session, team_id: int, user_id: int) -> None:
    db.query(TeamMember).filter(TeamMember.team_id == team_id, TeamMember.user_id == user_id).delete()
    db.commit()
