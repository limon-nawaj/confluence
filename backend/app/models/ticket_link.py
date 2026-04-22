import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class LinkType(str, enum.Enum):
    blocks = "blocks"
    blocked_by = "blocked_by"
    relates_to = "relates_to"
    duplicates = "duplicates"
    duplicated_by = "duplicated_by"
    clones = "clones"


class TicketLink(Base):
    __tablename__ = "ticket_links"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    source_ticket_id: Mapped[int] = mapped_column(
        ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    target_ticket_id: Mapped[int] = mapped_column(
        ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    link_type: Mapped[LinkType] = mapped_column(
        SAEnum(LinkType, name="link_type_enum", create_constraint=True),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    # Relationships
    source_ticket: Mapped["Ticket"] = relationship(
        "Ticket", foreign_keys=[source_ticket_id], back_populates="links_as_source"
    )
    target_ticket: Mapped["Ticket"] = relationship(
        "Ticket", foreign_keys=[target_ticket_id], back_populates="links_as_target"
    )
