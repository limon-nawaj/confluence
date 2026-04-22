from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

from app.models.project_permission import ProjectRole


class TicketProjectUserMini(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    
    model_config = {"from_attributes": True}

class TicketProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    key: str = Field(..., min_length=1, max_length=10, pattern=r"^[A-Z0-9]+$")
    description: Optional[str] = None
    team_id: Optional[int] = None
    icon_color: str = "#6366f1"
    icon_emoji: str = "🎫"


class TicketProjectCreate(TicketProjectBase):
    pass


class TicketProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    team_id: Optional[int] = None
    icon_color: Optional[str] = None
    icon_emoji: Optional[str] = None


class TicketProjectOut(TicketProjectBase):
    id: int
    owner_id: int
    ticket_counter: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TicketProjectDetail(TicketProjectOut):
    owner: Optional[TicketProjectUserMini] = None
    open_ticket_count: int = 0

class ProjectPermissionCreate(BaseModel):
    user_id: int
    role: ProjectRole

class ProjectPermissionOut(BaseModel):
    id: int
    project_id: int
    user_id: int
    role: ProjectRole
    user: TicketProjectUserMini
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
