from __future__ import annotations
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from app.models.ticket import TicketType, TicketStatus, TicketPriority
from app.models.ticket_link import LinkType


# ─────────────────────────────────────────────
# User mini schema (for nested responses)
# ─────────────────────────────────────────────
class UserMini(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# Label schemas
# ─────────────────────────────────────────────
class LabelOut(BaseModel):
    id: int
    name: str
    color: str

    model_config = {"from_attributes": True}


class LabelCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: str = "#6366f1"


# ─────────────────────────────────────────────
# Comment schemas
# ─────────────────────────────────────────────
class TicketCommentCreate(BaseModel):
    content: str = Field(..., min_length=1)
    parent_id: Optional[int] = None


class TicketCommentUpdate(BaseModel):
    content: str = Field(..., min_length=1)


class TicketCommentOut(BaseModel):
    id: int
    ticket_id: int
    author_id: int
    author: UserMini
    parent_id: Optional[int] = None
    content: str
    created_at: datetime
    updated_at: datetime
    replies: List["TicketCommentOut"] = []

    model_config = {"from_attributes": True}


TicketCommentOut.model_rebuild()


# ─────────────────────────────────────────────
# Ticket link schemas
# ─────────────────────────────────────────────
class TicketLinkCreate(BaseModel):
    target_ticket_id: int
    link_type: LinkType


class TicketLinkOut(BaseModel):
    id: int
    source_ticket_id: int
    target_ticket_id: int
    link_type: LinkType
    created_at: datetime

    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# Ticket schemas
# ─────────────────────────────────────────────
class TicketBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    type: TicketType = TicketType.task
    priority: TicketPriority = TicketPriority.medium
    story_points: Optional[int] = Field(None, ge=0, le=999)
    due_date: Optional[date] = None
    parent_id: Optional[int] = None


class TicketCreate(TicketBase):
    project_id: int
    sprint_id: Optional[int] = None
    assignee_ids: List[int] = []
    label_ids: List[int] = []


class TicketUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    type: Optional[TicketType] = None
    priority: Optional[TicketPriority] = None
    story_points: Optional[int] = Field(None, ge=0, le=999)
    due_date: Optional[date] = None
    parent_id: Optional[int] = None
    created_by: Optional[int] = None
    assignee_ids: Optional[List[int]] = None
    label_ids: Optional[List[int]] = None


class TicketStatusUpdate(BaseModel):
    status: TicketStatus


class TicketOut(TicketBase):
    id: int
    project_id: int
    ticket_key: str
    status: TicketStatus
    created_by: int
    creator: Optional[UserMini] = None
    assignees: List[UserMini] = []
    labels: List[LabelOut] = []
    sprint_ids: List[int] = []
    created_at: datetime
    updated_at: datetime
    children_count: int = 0

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_ticket(cls, ticket) -> "TicketOut":
        data = {
            "id": ticket.id,
            "project_id": ticket.project_id,
            "ticket_key": ticket.ticket_key,
            "title": ticket.title,
            "description": ticket.description,
            "type": ticket.type,
            "status": ticket.status,
            "priority": ticket.priority,
            "story_points": ticket.story_points,
            "due_date": ticket.due_date,
            "parent_id": ticket.parent_id,
            "created_by": ticket.created_by,
            "created_at": ticket.created_at,
            "updated_at": ticket.updated_at,
            "creator": ticket.creator,
            "assignees": [a.user for a in ticket.assignees],
            "labels": [a.label for a in ticket.label_assocs],
            "sprint_ids": [s.sprint_id for s in ticket.sprint_assocs] if hasattr(ticket, "sprint_assocs") else [],
            "children_count": len(ticket.children),
        }
        return cls(**data)


class TicketDetail(TicketOut):
    comments: List[TicketCommentOut] = []
    links_as_source: List[TicketLinkOut] = []
    links_as_target: List[TicketLinkOut] = []
    watchers: List[UserMini] = []
