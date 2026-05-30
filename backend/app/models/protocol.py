import uuid

from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID

from .base import Base, TimestampMixin


class GovernanceProposal(Base, TimestampMixin):
    __tablename__ = "governance_proposals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    onchain_id = Column(BigInteger, nullable=True, unique=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    proposer = Column(String, nullable=False, index=True)
    status = Column(String, nullable=False, default="active", index=True)
    for_votes = Column(BigInteger, nullable=False, default=0)
    against_votes = Column(BigInteger, nullable=False, default=0)
    abstain_votes = Column(BigInteger, nullable=False, default=0)
    voting_ends_at = Column(DateTime(timezone=True), nullable=True)
    executable_after = Column(DateTime(timezone=True), nullable=True)
    lifecycle_log = Column(JSON, nullable=False, default=list)


class ReferralCampaign(Base, TimestampMixin):
    __tablename__ = "referral_campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String, nullable=False, unique=True, index=True)
    owner = Column(String, nullable=False, index=True)
    uses = Column(BigInteger, nullable=False, default=0)
    rewards_earned = Column(BigInteger, nullable=False, default=0)
    rewards_pending = Column(BigInteger, nullable=False, default=0)
    rewards_settled = Column(BigInteger, nullable=False, default=0)
    rewards_claimed = Column(BigInteger, nullable=False, default=0)
    last_swap_id = Column(BigInteger, nullable=True)


class ReferralReward(Base, TimestampMixin):
    __tablename__ = "referral_rewards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(
        UUID(as_uuid=True),
        ForeignKey("referral_campaigns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    code = Column(String, nullable=False, index=True)
    swap_id = Column(BigInteger, nullable=True)
    amount = Column(BigInteger, nullable=False)
    status = Column(String, nullable=False, default="pending", index=True)
    settled_at = Column(DateTime(timezone=True), nullable=True)
    claimed_at = Column(DateTime(timezone=True), nullable=True)
