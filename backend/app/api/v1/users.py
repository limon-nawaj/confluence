from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db, require_admin
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserRoleUpdate, UserUpdate
from app.services import user_service

router = APIRouter()


@router.get("/search", response_model=list[UserResponse])
def search_users(
    q: str,
    limit: int = 10,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from sqlalchemy import or_
    search_term = f"%{q}%"
    users = db.query(User).filter(
        User.is_active == True,
        or_(
            User.username.ilike(search_term),
            User.full_name.ilike(search_term)
        )
    ).limit(limit).all()
    return users

@router.get("", response_model=list[UserResponse], dependencies=[Depends(require_admin)])
def list_users(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)) -> list[User]:
    return user_service.get_users(db, skip, limit)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> User:
    user = user_service.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.id != user_id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Cannot update another user's profile")
    user = user_service.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_service.update_user(db, user, data)


@router.patch("/{user_id}/role", response_model=UserResponse, dependencies=[Depends(require_admin)])
def update_role(
    user_id: int, data: UserRoleUpdate, db: Session = Depends(get_db)
) -> User:
    user = user_service.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = data.role
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def deactivate_user(user_id: int, db: Session = Depends(get_db)) -> None:
    user = user_service.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.commit()
