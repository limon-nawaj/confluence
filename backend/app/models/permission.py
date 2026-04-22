import enum

from sqlalchemy import Enum as SAEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class PermissionLevel(str, enum.Enum):
    view = "view"
    edit = "edit"
    admin = "admin"


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    space_id: Mapped[int] = mapped_column(ForeignKey("spaces.id"), nullable=False, index=True)
    level: Mapped[PermissionLevel] = mapped_column(
        SAEnum(PermissionLevel, name="permission_level_enum", create_constraint=True),
        default=PermissionLevel.view,
        nullable=False,
    )

    user: Mapped["User"] = relationship(back_populates="permissions")
    space: Mapped["Space"] = relationship(back_populates="permissions")
