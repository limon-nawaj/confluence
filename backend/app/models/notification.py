from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    recipient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    actor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    page_id: Mapped[Optional[int]] = mapped_column(ForeignKey("pages.id", ondelete="CASCADE"), nullable=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False, default="page_modified")
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    recipient: Mapped["User"] = relationship(foreign_keys=[recipient_id])
    actor: Mapped["User"] = relationship(foreign_keys=[actor_id])
    page: Mapped[Optional["Page"]] = relationship(foreign_keys=[page_id])
