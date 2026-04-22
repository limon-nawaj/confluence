import enum
from datetime import datetime, date
from typing import List, Optional

from sqlalchemy import (
    Boolean, Date, DateTime, Enum as SAEnum, ForeignKey, Integer, String, Text, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class TicketType(str, enum.Enum):
    bug = "bug"
    feature = "feature"
    task = "task"
    improvement = "improvement"
    epic = "epic"


class TicketStatus(str, enum.Enum):
    backlog = "backlog"
    todo = "todo"
    in_progress = "in_progress"
    in_review = "in_review"
    done = "done"
    cancelled = "cancelled"


class TicketPriority(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("ticket_projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    parent_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("tickets.id", ondelete="SET NULL"), index=True
    )
    ticket_key: Mapped[str] = mapped_column(String(30), nullable=False, unique=True, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    type: Mapped[TicketType] = mapped_column(
        SAEnum(TicketType, name="ticket_type_enum", create_constraint=True),
        default=TicketType.task, nullable=False,
    )
    status: Mapped[TicketStatus] = mapped_column(
        SAEnum(TicketStatus, name="ticket_status_enum", create_constraint=True),
        default=TicketStatus.backlog, nullable=False, index=True,
    )
    priority: Mapped[TicketPriority] = mapped_column(
        SAEnum(TicketPriority, name="ticket_priority_enum", create_constraint=True),
        default=TicketPriority.medium, nullable=False,
    )
    story_points: Mapped[Optional[int]] = mapped_column(Integer)
    due_date: Mapped[Optional[date]] = mapped_column(Date)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    project: Mapped["TicketProject"] = relationship("TicketProject", back_populates="tickets")
    creator: Mapped["User"] = relationship("User", foreign_keys=[created_by])
    parent: Mapped[Optional["Ticket"]] = relationship(
        "Ticket", remote_side="Ticket.id", foreign_keys=[parent_id], back_populates="children"
    )
    children: Mapped[List["Ticket"]] = relationship(
        "Ticket", foreign_keys=[parent_id], back_populates="parent"
    )
    assignees: Mapped[List["TicketAssignee"]] = relationship(
        "TicketAssignee", back_populates="ticket", cascade="all, delete-orphan"
    )
    watchers: Mapped[List["TicketWatcher"]] = relationship(
        "TicketWatcher", back_populates="ticket", cascade="all, delete-orphan"
    )
    comments: Mapped[List["TicketComment"]] = relationship(
        "TicketComment", back_populates="ticket", cascade="all, delete-orphan"
    )
    label_assocs: Mapped[List["TicketLabelAssoc"]] = relationship(
        "TicketLabelAssoc", back_populates="ticket", cascade="all, delete-orphan"
    )
    links_as_source: Mapped[List["TicketLink"]] = relationship(
        "TicketLink", foreign_keys="TicketLink.source_ticket_id",
        back_populates="source_ticket", cascade="all, delete-orphan"
    )
    links_as_target: Mapped[List["TicketLink"]] = relationship(
        "TicketLink", foreign_keys="TicketLink.target_ticket_id",
        back_populates="target_ticket", cascade="all, delete-orphan"
    )
    sprint_assocs: Mapped[List["SprintTicket"]] = relationship(
        "SprintTicket", back_populates="ticket", cascade="all, delete-orphan"
    )


class TicketAssignee(Base):
    """Many-to-many: tickets ↔ users (assignees)."""
    __tablename__ = "ticket_assignees"

    ticket_id: Mapped[int] = mapped_column(
        ForeignKey("tickets.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    assigned_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="assignees")
    user: Mapped["User"] = relationship("User")


class TicketWatcher(Base):
    """Many-to-many: tickets ↔ users (watchers/subscribers)."""
    __tablename__ = "ticket_watchers"

    ticket_id: Mapped[int] = mapped_column(
        ForeignKey("tickets.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="watchers")
    user: Mapped["User"] = relationship("User")
