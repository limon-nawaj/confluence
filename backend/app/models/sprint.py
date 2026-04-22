import enum
from datetime import datetime, date
from typing import Optional, List

from sqlalchemy import Date, DateTime, Enum as SAEnum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class SprintStatus(str, enum.Enum):
    planning = "planning"
    active = "active"
    completed = "completed"


class Sprint(Base):
    __tablename__ = "sprints"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("ticket_projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    goal: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[SprintStatus] = mapped_column(
        SAEnum(SprintStatus, name="sprint_status_enum", create_constraint=True),
        default=SprintStatus.planning, nullable=False,
    )
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    project: Mapped["TicketProject"] = relationship("TicketProject", back_populates="sprints")
    ticket_assocs: Mapped[List["SprintTicket"]] = relationship(
        "SprintTicket", back_populates="sprint", cascade="all, delete-orphan"
    )


class SprintTicket(Base):
    """Association table: sprint ↔ tickets (many-to-many)."""
    __tablename__ = "sprint_tickets"

    sprint_id: Mapped[int] = mapped_column(
        ForeignKey("sprints.id", ondelete="CASCADE"), primary_key=True
    )
    ticket_id: Mapped[int] = mapped_column(
        ForeignKey("tickets.id", ondelete="CASCADE"), primary_key=True
    )
    added_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    sprint: Mapped["Sprint"] = relationship("Sprint", back_populates="ticket_assocs")
    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="sprint_assocs")
