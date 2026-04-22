from sqlalchemy.orm import Session

from app.models.comment import Comment
from app.schemas.comment import CommentCreate, CommentUpdate


def get_page_comments(db: Session, page_id: int) -> list[Comment]:
    """Return only root-level comments; replies are nested via ORM relationship."""
    return (
        db.query(Comment)
        .filter(Comment.page_id == page_id, Comment.parent_id == None)
        .order_by(Comment.created_at)
        .all()
    )


def get_comment(db: Session, comment_id: int) -> Comment | None:
    return db.get(Comment, comment_id)


def create_comment(
    db: Session, page_id: int, author_id: int, data: CommentCreate
) -> Comment:
    comment = Comment(
        page_id=page_id,
        author_id=author_id,
        parent_id=data.parent_id,
        content=data.content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


def update_comment(db: Session, comment: Comment, data: CommentUpdate) -> Comment:
    comment.content = data.content
    db.commit()
    db.refresh(comment)
    return comment


def delete_comment(db: Session, comment: Comment) -> None:
    db.delete(comment)
    db.commit()


def toggle_resolve(db: Session, comment: Comment) -> Comment:
    comment.is_resolved = not comment.is_resolved
    db.commit()
    db.refresh(comment)
    return comment
