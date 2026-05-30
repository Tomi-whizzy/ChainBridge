"""Add database indexes for order filters (#444)

Revision ID: 20260328_0003
Revises: 20260328_0002
Create Date: 2026-05-30 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op

revision: str = "20260328_0003"
down_revision: Union[str, None] = "20260328_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_swap_orders_status_created_at",
        "swap_orders",
        ["status", "created_at"],
        unique=False,
        postgresql_where=None,
    )
    op.create_index(
        "ix_swap_orders_market_filter",
        "swap_orders",
        ["from_chain", "to_chain", "status", "created_at"],
        unique=False,
        postgresql_where=None,
    )
    op.create_index(
        "ix_swap_orders_from_chain",
        "swap_orders",
        ["from_chain"],
        unique=False,
    )
    op.create_index(
        "ix_swap_orders_to_chain",
        "swap_orders",
        ["to_chain"],
        unique=False,
    )
    op.create_index(
        "ix_swap_orders_created_at",
        "swap_orders",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_swap_orders_created_at", table_name="swap_orders")
    op.drop_index("ix_swap_orders_to_chain", table_name="swap_orders")
    op.drop_index("ix_swap_orders_from_chain", table_name="swap_orders")
    op.drop_index("ix_swap_orders_market_filter", table_name="swap_orders")
    op.drop_index("ix_swap_orders_status_created_at", table_name="swap_orders")
