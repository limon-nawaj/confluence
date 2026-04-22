from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Space(Base):
    __tablename__ = "spaces"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    key: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    owner: Mapped["User"] = relationship(back_populates="owned_spaces")
    all_pages: Mapped[List["Page"]] = relationship(
        back_populates="space",
        foreign_keys="Page.space_id",
        cascade="all, delete-orphan",
    )
    permissions: Mapped[List["Permission"]] = relationship(
        back_populates="space", cascade="all, delete-orphan"
    )
    team_access: Mapped[List["SpaceTeamAccess"]] = relationship(
        back_populates="space", cascade="all, delete-orphan"
    )


class SpaceTeamAccess(Base):
    __tablename__ = "space_team_access"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    space_id: Mapped[int] = mapped_column(ForeignKey("spaces.id"), nullable=False, index=True)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"), nullable=False, index=True)
    permission: Mapped[str] = mapped_column(String(50), default="read", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    space: Mapped["Space"] = relationship(back_populates="team_access")
    team: Mapped["Team"] = relationship()
