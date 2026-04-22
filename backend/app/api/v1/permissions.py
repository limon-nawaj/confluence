from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.permission import Permission
from app.models.user import User, UserRole
from app.schemas.permission import PermissionCreate, PermissionResponse
from app.services.space_service import get_space_by_key

router = APIRouter()


@router.get("/spaces/{space_key}", response_model=list[PermissionResponse])
def list_permissions(
    space_key: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    space = get_space_by_key(db, space_key)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    return space.permissions


@router.post("/spaces/{space_key}", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
def grant_permission(
    space_key: str,
    data: PermissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    space = get_space_by_key(db, space_key)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    if space.owner_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Only space owner or admin can manage permissions")

    perm = Permission(user_id=data.user_id, space_id=space.id, level=data.level)
    db.add(perm)
    db.commit()
    db.refresh(perm)
    return perm


@router.delete("/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_permission(
    permission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    perm = db.get(Permission, permission_id)
    if not perm:
        raise HTTPException(status_code=404, detail="Permission not found")
    space = perm.space
    if space.owner_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Only space owner or admin can revoke permissions")
    db.delete(perm)
    db.commit()
