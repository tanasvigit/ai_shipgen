"""add user-driver link

Revision ID: 2f2a4d1f9b11
Revises: 9552e0de374c
Create Date: 2026-04-17 18:10:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2f2a4d1f9b11"
down_revision: Union[str, None] = "9552e0de374c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("driver_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_users_driver_id_drivers", "users", "drivers", ["driver_id"], ["id"])


def downgrade() -> None:
    op.drop_constraint("fk_users_driver_id_drivers", "users", type_="foreignkey")
    op.drop_column("users", "driver_id")
