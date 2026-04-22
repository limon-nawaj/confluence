from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User, UserRole
from app.schemas.comment import CommentCreate, CommentResponse, CommentUpdate
from app.services import comment_service

router = APIRouter()


@router.get("/pages/{page_id}", response_model=list[CommentResponse])
def list_comments(
    page_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return comment_service.get_page_comments(db, page_id)


@router.post("/pages/{page_id}", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    page_id: int,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return comment_service.create_comment(db, page_id, current_user.id, data)


@router.post("/{comment_id}/reply", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def reply_to_comment(
    comment_id: int,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    parent = comment_service.get_comment(db, comment_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Comment not found")
    reply_data = CommentCreate(content=data.content, parent_id=comment_id)
    return comment_service.create_comment(db, parent.page_id, current_user.id, reply_data)


@router.put("/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: int,
    data: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = comment_service.get_comment(db, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot edit another user's comment")
    return comment_service.update_comment(db, comment, data)


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    comment = comment_service.get_comment(db, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.author_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Cannot delete another user's comment")
    comment_service.delete_comment(db, comment)


@router.patch("/{comment_id}/resolve", response_model=CommentResponse)
def resolve_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    comment = comment_service.get_comment(db, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    return comment_service.toggle_resolve(db, comment)
