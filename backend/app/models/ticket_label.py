from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class TicketLabel(Base):
    __tablename__ = "ticket_labels"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("ticket_projects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str] = mapped_column(String(20), default="#6366f1")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    project: Mapped["TicketProject"] = relationship("TicketProject", back_populates="labels")
    ticket_assocs: Mapped[list["TicketLabelAssoc"]] = relationship(
        "TicketLabelAssoc", back_populates="label", cascade="all, delete-orphan"
    )


class TicketLabelAssoc(Base):
    """Association table: tickets ↔ labels (many-to-many)."""
    __tablename__ = "ticket_label_assocs"

    ticket_id: Mapped[int] = mapped_column(
        ForeignKey("tickets.id", ondelete="CASCADE"), primary_key=True
    )
    label_id: Mapped[int] = mapped_column(
        ForeignKey("ticket_labels.id", ondelete="CASCADE"), primary_key=True
    )

    # Relationships
    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="label_assocs")
    label: Mapped["TicketLabel"] = relationship("TicketLabel", back_populates="ticket_assocs")
