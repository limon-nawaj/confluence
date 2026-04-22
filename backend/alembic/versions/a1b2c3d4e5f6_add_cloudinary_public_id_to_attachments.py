"""Add cloudinary_public_id to attachments

Revision ID: a1b2c3d4e5f6
Revises: c3e1f2a4b5d6
Create Date: 2026-04-22

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'c3e1f2a4b5d6'
branch_labels: Union[Sequence[str], None] = None
depends_on: Union[Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('attachments', schema=None) as batch_op:
        batch_op.add_column(sa.Column('cloudinary_public_id', sa.String(500), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('attachments', schema=None) as batch_op:
        batch_op.drop_column('cloudinary_public_id')
