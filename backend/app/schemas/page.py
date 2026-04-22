from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.user import UserResponse


class PageBase(BaseModel):
    title: str
    content: Optional[str] = None
    is_published: bool = False


class PageCreate(PageBase):
    parent_id: Optional[int] = None
    template_id: Optional[int] = None


class PageUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_published: Optional[bool] = None
    change_summary: Optional[str] = ""


class PageMove(BaseModel):
    parent_id: Optional[int] = None
    space_id: Optional[int] = None


class PageResponse(PageBase):
    id: int
    space_id: int
    parent_id: Optional[int]
    author_id: int
    position: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PageDetailResponse(PageResponse):
    author: UserResponse
    # Self-referential: children are also full PageDetailResponse objects
    # so the entire tree is returned recursively with no depth limit.
    children: List[PageDetailResponse] = []


# Pydantic v2 requires model_rebuild() for self-referential models
PageDetailResponse.model_rebuild()
