from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.space import Space
from app.models.user import User
from app.schemas.page import PageCreate, PageDetailResponse
from app.schemas.space import SpaceCreate, SpaceDetailResponse, SpaceResponse, SpaceUpdate
from app.schemas.team import SpaceTeamAccessCreate, SpaceTeamAccessResponse
from app.services import page_service, space_service, user_service

router = APIRouter()


def _check_access_or_403(db: Session, space: Space, user_id: int):
    if not space_service.has_space_access(db, space, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this space",
        )

def _check_write_access_or_403(db: Session, space: Space, user_id: int):
    if not space_service.has_space_write_access(db, space, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have write access to this space",
        )


@router.get("", response_model=list[SpaceResponse])
def list_spaces(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list:
    return space_service.get_spaces(db, current_user.id, skip, limit)


@router.post("", response_model=SpaceResponse, status_code=status.HTTP_201_CREATED)
def create_space(
    data: SpaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> object:
    return space_service.create_space(db, data, current_user.id)


@router.get("/{space_key}", response_model=SpaceDetailResponse)
def get_space(
    space_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> object:
    space = space_service.get_space_by_key(db, space_key)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    _check_access_or_403(db, space, current_user.id)
    # Expose per-user permissions (excluding owner's own row) as user_permissions
    space.user_permissions = [p for p in space.permissions if p.user_id != space.owner_id]
    return space


@router.put("/{space_key}", response_model=SpaceResponse)
def update_space(
    space_key: str,
    data: SpaceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> object:
    space = space_service.get_space_by_key(db, space_key)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    if space.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the space owner can update this space")
    return space_service.update_space(db, space, data)


@router.delete("/{space_key}", status_code=status.HTTP_204_NO_CONTENT)
def delete_space(
    space_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    space = space_service.get_space_by_key(db, space_key)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    if space.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the space owner can delete this space")
    space_service.delete_space(db, space)


@router.get("/{space_key}/pages", response_model=list[PageDetailResponse])
def get_space_pages(
    space_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list:
    space = space_service.get_space_by_key(db, space_key)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    _check_access_or_403(db, space, current_user.id)
    pages = page_service.get_root_pages(db, space.id, current_user.id)
    return [page_service.filter_page_tree(p, current_user.id) for p in pages]


@router.post("/{space_key}/pages", response_model=PageDetailResponse, status_code=status.HTTP_201_CREATED)
def create_page_in_space(
    space_key: str,
    data: PageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> object:
    space = space_service.get_space_by_key(db, space_key)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    # Any authenticated user with access to the space can create a page.
    _check_access_or_403(db, space, current_user.id)
    page = page_service.create_page(db, space.id, current_user.id, data)
    return page_service.filter_page_tree(page, current_user.id)

@router.post("/{space_key}/members")
def add_user_access(
    space_key: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    space = space_service.get_space_by_key(db, space_key)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    if space.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can manage user access")
    email = data.get("email")
    level = data.get("level", "view")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    if level not in ("view", "edit", "admin"):
        raise HTTPException(status_code=400, detail="Level must be 'view', 'edit', or 'admin'")
    target = user_service.get_user_by_email(db, email)
    if not target:
        raise HTTPException(status_code=404, detail="User with that email not found")
    if target.id == space.owner_id:
        raise HTTPException(status_code=400, detail="Owner already has full access")
    perm = space_service.add_user_permission(db, space.id, target.id, level)
    return {
        "id": perm.id,
        "user_id": perm.user_id,
        "space_id": perm.space_id,
        "level": perm.level,
        "user": {"id": target.id, "email": target.email, "username": target.username, "full_name": target.full_name},
    }


@router.delete("/{space_key}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user_access(
    space_key: str,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    space = space_service.get_space_by_key(db, space_key)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    if space.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can manage user access")
    if user_id == space.owner_id:
        raise HTTPException(status_code=400, detail="Cannot remove owner's access")
    space_service.remove_user_permission(db, space.id, user_id)


@router.post("/{space_key}/teams", response_model=SpaceTeamAccessResponse)
def add_team_access(
    space_key: str,
    data: SpaceTeamAccessCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    space = space_service.get_space_by_key(db, space_key)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    if space.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can modify team access")
    return space_service.add_team_access(db, space.id, data.team_id, data.permission)

@router.delete("/{space_key}/teams/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_access(
    space_key: str,
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    space = space_service.get_space_by_key(db, space_key)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    if space.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can modify team access")
    space_service.remove_team_access(db, space.id, team_id)
