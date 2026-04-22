from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.user import UserResponse


class PageVersionResponse(BaseModel):
    id: int
    page_id: int
    version_number: int
    title: str
    content: str
    change_summary: str
    author_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class PageVersionDetailResponse(PageVersionResponse):
    author: UserResponse


class VersionDiffResponse(BaseModel):
    version_a: PageVersionResponse
    version_b: PageVersionResponse
    diff_lines: list[str]  # unified diff lines
