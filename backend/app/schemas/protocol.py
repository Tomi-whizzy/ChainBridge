from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

ProposalStatus = Literal["active", "succeeded", "defeated", "executed", "cancelled"]
ReferralRewardStatus = Literal["pending", "settled", "claimed"]


class ProposalLifecycleEvent(BaseModel):
    sequence: int
    from_status: Optional[str] = None
    to_status: str
    occurred_at: datetime
    detail: str


class GovernanceProposalCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10, max_length=4000)
    proposer: str
    onchain_id: Optional[int] = None
    voting_ends_at: Optional[datetime] = None
    executable_after: Optional[datetime] = None


class GovernanceProposalResponse(BaseModel):
    id: str
    onchain_id: Optional[int] = None
    title: str
    description: str
    proposer: str
    status: str
    for_votes: int
    against_votes: int
    abstain_votes: int
    participation_pct: float
    voting_ends_at: Optional[datetime] = None
    executable_after: Optional[datetime] = None
    lifecycle: list[ProposalLifecycleEvent] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class VotingPowerBreakdown(BaseModel):
    address: str
    self_power: int
    delegated_in: int
    effective_power: int
    has_outbound_delegation: bool


class ReferralCampaignCreate(BaseModel):
    code: str = Field(min_length=4, max_length=32)
    owner: str


class ReferralRewardResponse(BaseModel):
    id: str
    code: str
    swap_id: Optional[int] = None
    amount: int
    status: str
    settled_at: Optional[datetime] = None
    claimed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReferralCampaignResponse(BaseModel):
    id: str
    code: str
    owner: str
    uses: int
    rewards_earned: int
    rewards_pending: int
    rewards_settled: int
    rewards_claimed: int
    conversion_rate_pct: float
    rewards: list[ReferralRewardResponse] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReferralSharePayload(BaseModel):
    code: str
    owner: str
    qr_content: str
    share_url: str
    qr_image_base64: str
    created_at: datetime
