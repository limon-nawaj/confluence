import enum
from datetime import datetime
from typing import List, Optional

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class TicketProject(Base):
    __tablename__ = "ticket_projects"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    key: Mapped[str] = mapped_column(String(10), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    team_id: Mapped[Optional[int]] = mapped_column(ForeignKey("teams.id", ondelete="SET NULL"))
    icon_color: Mapped[str] = mapped_column(String(20), default="#6366f1")
    icon_emoji: Mapped[str] = mapped_column(String(10), default="🎫")
    ticket_counter: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    owner: Mapped["User"] = relationship("User", foreign_keys=[owner_id])
    team: Mapped[Optional["Team"]] = relationship("Team", foreign_keys=[team_id])
    tickets: Mapped[List["Ticket"]] = relationship(
        "Ticket", back_populates="project", cascade="all, delete-orphan"
    )
    sprints: Mapped[List["Sprint"]] = relationship(
        "Sprint", back_populates="project", cascade="all, delete-orphan"
    )
    labels: Mapped[List["TicketLabel"]] = relationship(
        "TicketLabel", back_populates="project", cascade="all, delete-orphan"
    )
    permissions: Mapped[List["ProjectPermission"]] = relationship(
        "ProjectPermission", back_populates="project", cascade="all, delete-orphan"
    )
