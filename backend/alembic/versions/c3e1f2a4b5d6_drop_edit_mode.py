"""Drop edit_mode from pages

Revision ID: c3e1f2a4b5d6
Revises: 6f4da78d5f50
Branch Labels: None
Depends On: None

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'c3e1f2a4b5d6'
down_revision: Union[str, None] = '6f4da78d5f50'
branch_labels: Union[Sequence[str], None] = None
depends_on: Union[Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('pages', schema=None) as batch_op:
        batch_op.drop_column('edit_mode')


def downgrade() -> None:
    with op.batch_alter_table('pages', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                'edit_mode',
                sa.Enum('only_me', 'everyone', name='edit_mode_enum'),
                nullable=False,
                server_default='only_me',
            )
        )
