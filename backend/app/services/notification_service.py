from sqlalchemy.orm import Session, joinedload

from app.models.notification import Notification
from app.models.page import Page


def create_notification(
    db: Session,
    recipient_id: int,
    actor_id: int,
    page_id: int | None,
    type: str,
    message: str,
) -> Notification:
    notif = Notification(
        recipient_id=recipient_id,
        actor_id=actor_id,
        page_id=page_id,
        type=type,
        message=message,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def get_notifications(db: Session, user_id: int, limit: int = 50) -> list[Notification]:
    return (
        db.query(Notification)
        .options(
            joinedload(Notification.actor),
            joinedload(Notification.page).joinedload(Page.space),
        )
        .filter(Notification.recipient_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .all()
    )


def get_unread_count(db: Session, user_id: int) -> int:
    return (
        db.query(Notification)
        .filter(Notification.recipient_id == user_id, Notification.is_read == False)
        .count()
    )


def mark_read(db: Session, notification_id: int, user_id: int) -> Notification | None:
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.recipient_id == user_id,
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
        db.refresh(notif)
    return notif


def mark_all_read(db: Session, user_id: int) -> None:
    db.query(Notification).filter(
        Notification.recipient_id == user_id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
