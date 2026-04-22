from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ActorInfo(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None

    model_config = {"from_attributes": True}


class PageInfo(BaseModel):
    id: int
    title: str
    space_id: int
    space_key: Optional[str] = None

    model_config = {"from_attributes": True}

    @classmethod
    def from_page(cls, page) -> "PageInfo":
        return cls(
            id=page.id,
            title=page.title,
            space_id=page.space_id,
            space_key=page.space.key if page.space else None,
        )


class NotificationResponse(BaseModel):
    id: int
    recipient_id: int
    actor_id: int
    page_id: Optional[int] = None
    type: str
    message: str
    is_read: bool
    created_at: datetime
    actor: Optional[ActorInfo] = None
    page: Optional[PageInfo] = None

    model_config = {"from_attributes": True}


class UnreadCountResponse(BaseModel):
    count: int
