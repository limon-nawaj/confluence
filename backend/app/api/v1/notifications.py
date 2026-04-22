from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.notification import NotificationResponse, PageInfo, UnreadCountResponse
from app.services import notification_service

router = APIRouter()


@router.get("", response_model=list[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list:
    notifications = notification_service.get_notifications(db, current_user.id)
    # Attach space_key to each page info so the frontend can build slug URLs
    result = []
    for n in notifications:
        data = NotificationResponse.model_validate(n)
        if n.page:
            data.page = PageInfo.from_page(n.page)
        result.append(data)
    return result


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    count = notification_service.get_unread_count(db, current_user.id)
    return {"count": count}


@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> object:
    notif = notification_service.mark_read(db, notification_id, current_user.id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notif


@router.put("/read-all", status_code=204)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    notification_service.mark_all_read(db, current_user.id)
