from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Page(Base):
    __tablename__ = "pages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    # Tiptap JSON stored as TEXT — fully portable across SQLite and Oracle
    content: Mapped[Optional[str]] = mapped_column(Text)
    # Plain-text version used by the FTS index
    content_text: Mapped[Optional[str]] = mapped_column(Text)
    space_id: Mapped[int] = mapped_column(ForeignKey("spaces.id"), nullable=False, index=True)
    parent_id: Mapped[Optional[int]] = mapped_column(ForeignKey("pages.id"), nullable=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    template_id: Mapped[Optional[int]] = mapped_column(ForeignKey("templates.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    space: Mapped["Space"] = relationship(back_populates="all_pages", foreign_keys=[space_id])
    author: Mapped["User"] = relationship(back_populates="pages", foreign_keys=[author_id])
    parent: Mapped[Optional["Page"]] = relationship(
        back_populates="children", remote_side="Page.id", foreign_keys=[parent_id]
    )
    children: Mapped[List["Page"]] = relationship(
        back_populates="parent", foreign_keys="Page.parent_id", order_by="Page.position"
    )
    versions: Mapped[List["PageVersion"]] = relationship(
        back_populates="page",
        cascade="all, delete-orphan",
        order_by="PageVersion.version_number.desc()",
    )
    comments: Mapped[List["Comment"]] = relationship(
        back_populates="page", cascade="all, delete-orphan"
    )
    attachments: Mapped[List["Attachment"]] = relationship(
        back_populates="page", cascade="all, delete-orphan"
    )
    template: Mapped[Optional["Template"]] = relationship(foreign_keys=[template_id])
