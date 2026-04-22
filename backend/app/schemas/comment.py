from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.user import UserResponse


class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None


class CommentUpdate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: int
    page_id: int
    author_id: int
    parent_id: Optional[int]
    content: str
    is_resolved: bool
    created_at: datetime
    updated_at: datetime
    author: UserResponse
    replies: List[CommentResponse] = []

    model_config = {"from_attributes": True}
