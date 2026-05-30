"""Add protocol governance and referral tables."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20260530_0004"
down_revision: Union[str, None] = "20260328_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "governance_proposals",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("onchain_id", sa.BigInteger(), nullable=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("proposer", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="active"),
        sa.Column("for_votes", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("against_votes", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("abstain_votes", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("voting_ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("executable_after", sa.DateTime(timezone=True), nullable=True),
        sa.Column("lifecycle_log", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("onchain_id"),
    )
    op.create_index("ix_governance_proposals_proposer", "governance_proposals", ["proposer"])
    op.create_index("ix_governance_proposals_status", "governance_proposals", ["status"])

    op.create_table(
        "referral_campaigns",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("owner", sa.String(), nullable=False),
        sa.Column("uses", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("rewards_earned", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("rewards_pending", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("rewards_settled", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("rewards_claimed", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("last_swap_id", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_referral_campaigns_code", "referral_campaigns", ["code"])
    op.create_index("ix_referral_campaigns_owner", "referral_campaigns", ["owner"])

    op.create_table(
        "referral_rewards",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("swap_id", sa.BigInteger(), nullable=True),
        sa.Column("amount", sa.BigInteger(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("settled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("claimed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["campaign_id"], ["referral_campaigns.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_referral_rewards_campaign_id", "referral_rewards", ["campaign_id"])
    op.create_index("ix_referral_rewards_code", "referral_rewards", ["code"])
    op.create_index("ix_referral_rewards_status", "referral_rewards", ["status"])


def downgrade() -> None:
    op.drop_index("ix_referral_rewards_status", table_name="referral_rewards")
    op.drop_index("ix_referral_rewards_code", table_name="referral_rewards")
    op.drop_index("ix_referral_rewards_campaign_id", table_name="referral_rewards")
    op.drop_table("referral_rewards")
    op.drop_index("ix_referral_campaigns_owner", table_name="referral_campaigns")
    op.drop_index("ix_referral_campaigns_code", table_name="referral_campaigns")
    op.drop_table("referral_campaigns")
    op.drop_index("ix_governance_proposals_status", table_name="governance_proposals")
    op.drop_index("ix_governance_proposals_proposer", table_name="governance_proposals")
    op.drop_table("governance_proposals")
