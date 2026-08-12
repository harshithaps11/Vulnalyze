"""Merge heads

Revision ID: 45c2f6932d46
Revises: 002, add_vulnerability_table
Create Date: 2026-08-12 09:58:27.389731

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '45c2f6932d46'
down_revision: Union[str, None] = ('002', 'add_vulnerability_table')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
