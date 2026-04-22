from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.space import Space, SpaceTeamAccess
from app.models.team import TeamMember
from app.models.permission import Permission, PermissionLevel
from app.schemas.space import SpaceCreate, SpaceUpdate


def get_space_by_key(db: Session, key: str) -> Space | None:
    return db.query(Space).filter(Space.key == key).first()


def get_spaces(db: Session, user_id: int, skip: int = 0, limit: int = 50) -> list[Space]:
    return (
        db.query(Space)
        .outerjoin(SpaceTeamAccess, Space.id == SpaceTeamAccess.space_id)
        .outerjoin(TeamMember, SpaceTeamAccess.team_id == TeamMember.team_id)
        .outerjoin(Permission, (Permission.space_id == Space.id) & (Permission.user_id == user_id))
        .filter(
            or_(
                Space.is_public == True,
                Space.owner_id == user_id,
                TeamMember.user_id == user_id,
                Permission.id.isnot(None),
            )
        )
        .distinct()
        .offset(skip)
        .limit(limit)
        .all()
    )

def has_space_access(db: Session, space: Space, user_id: int) -> bool:
    if space.is_public or space.owner_id == user_id:
        return True
    # Direct per-user permission grant
    perm = (
        db.query(Permission)
        .filter(Permission.space_id == space.id, Permission.user_id == user_id)
        .first()
    )
    if perm is not None:
        return True
    # Team-based access
    acc = (
        db.query(SpaceTeamAccess)
        .join(TeamMember, SpaceTeamAccess.team_id == TeamMember.team_id)
        .filter(SpaceTeamAccess.space_id == space.id, TeamMember.user_id == user_id)
        .first()
    )
    return acc is not None


def has_space_write_access(db: Session, space: Space, user_id: int) -> bool:
    if space.owner_id == user_id:
        return True
    # Direct per-user permission: edit or admin grants write
    perm = (
        db.query(Permission)
        .filter(
            Permission.space_id == space.id,
            Permission.user_id == user_id,
            Permission.level.in_([PermissionLevel.edit, PermissionLevel.admin]),
        )
        .first()
    )
    if perm is not None:
        return True
    # Team-based write access
    acc = (
        db.query(SpaceTeamAccess)
        .join(TeamMember, SpaceTeamAccess.team_id == TeamMember.team_id)
        .filter(SpaceTeamAccess.space_id == space.id, TeamMember.user_id == user_id)
        .filter(SpaceTeamAccess.permission == "write")
        .first()
    )
    return acc is not None


def create_space(db: Session, data: SpaceCreate, owner_id: int) -> Space:
    if get_space_by_key(db, data.key):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Space key '{data.key}' is already taken",
        )
    space = Space(**data.model_dump(), owner_id=owner_id)
    db.add(space)
    db.flush()
    # Owner gets admin permission automatically
    perm = Permission(user_id=owner_id, space_id=space.id, level=PermissionLevel.admin)
    db.add(perm)
    db.commit()
    db.refresh(space)
    return space


def update_space(db: Session, space: Space, data: SpaceUpdate) -> Space:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(space, field, value)
    db.commit()
    db.refresh(space)
    return space


def delete_space(db: Session, space: Space) -> None:
    db.delete(space)
    db.commit()

def add_user_permission(db: Session, space_id: int, user_id: int, level: str = "view") -> Permission:
    perm = db.query(Permission).filter_by(space_id=space_id, user_id=user_id).first()
    if perm:
        perm.level = PermissionLevel(level)
        db.commit()
        db.refresh(perm)
        return perm
    perm = Permission(space_id=space_id, user_id=user_id, level=PermissionLevel(level))
    db.add(perm)
    db.commit()
    db.refresh(perm)
    return perm

def remove_user_permission(db: Session, space_id: int, user_id: int) -> None:
    db.query(Permission).filter_by(space_id=space_id, user_id=user_id).delete()
    db.commit()

def get_space_permissions(db: Session, space_id: int) -> list[Permission]:
    return db.query(Permission).filter(Permission.space_id == space_id).all()

def add_team_access(db: Session, space_id: int, team_id: int, permission: str = "read") -> SpaceTeamAccess:
    acc = db.query(SpaceTeamAccess).filter_by(space_id=space_id, team_id=team_id).first()
    if acc:
        return acc
    acc = SpaceTeamAccess(space_id=space_id, team_id=team_id, permission=permission)
    db.add(acc)
    db.commit()
    db.refresh(acc)
    return acc

def remove_team_access(db: Session, space_id: int, team_id: int) -> None:
    db.query(SpaceTeamAccess).filter_by(space_id=space_id, team_id=team_id).delete()
    db.commit()
