"""Protocol workspace endpoints for governance and referrals."""

import uuid
from datetime import datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.middleware.auth import require_api_key
from app.models.protocol import GovernanceProposal, ReferralCampaign, ReferralReward
from app.schemas.protocol import (
    GovernanceProposalCreate,
    GovernanceProposalResponse,
    ProposalLifecycleEvent,
    ReferralCampaignCreate,
    ReferralCampaignResponse,
    ReferralRewardResponse,
    ReferralSharePayload,
    VotingPowerBreakdown,
)
from app.services.governance import append_lifecycle_event, participation_pct, resolve_voting_power
from app.services.referral import build_share_payload, claim_rewards, record_reward, settle_reward

router = APIRouter()

TOTAL_VOTING_SUPPLY = 10_000
PROPOSAL_THRESHOLD = 100

_STAKES: dict[str, int] = {}
_DELEGATIONS: dict[str, str] = {}


def _proposal_response(proposal: GovernanceProposal) -> GovernanceProposalResponse:
    lifecycle = [
        ProposalLifecycleEvent(
            sequence=event["sequence"],
            from_status=event.get("from_status"),
            to_status=event["to_status"],
            occurred_at=datetime.fromisoformat(event["occurred_at"]),
            detail=event["detail"],
        )
        for event in (proposal.lifecycle_log or [])
    ]
    return GovernanceProposalResponse(
        id=str(proposal.id),
        onchain_id=proposal.onchain_id,
        title=proposal.title,
        description=proposal.description,
        proposer=proposal.proposer,
        status=proposal.status,
        for_votes=proposal.for_votes,
        against_votes=proposal.against_votes,
        abstain_votes=proposal.abstain_votes,
        participation_pct=participation_pct(
            proposal.for_votes,
            proposal.against_votes,
            proposal.abstain_votes,
            TOTAL_VOTING_SUPPLY,
        ),
        voting_ends_at=proposal.voting_ends_at,
        executable_after=proposal.executable_after,
        lifecycle=lifecycle,
        created_at=proposal.created_at,
        updated_at=proposal.updated_at,
    )


def _campaign_response(
    campaign: ReferralCampaign, rewards: list[ReferralReward]
) -> ReferralCampaignResponse:
    conversion = round((campaign.uses / max(campaign.uses + 1, 1)) * 100, 1) if campaign.uses else 0.0
    return ReferralCampaignResponse(
        id=str(campaign.id),
        code=campaign.code,
        owner=campaign.owner,
        uses=campaign.uses,
        rewards_earned=campaign.rewards_earned,
        rewards_pending=campaign.rewards_pending,
        rewards_settled=campaign.rewards_settled,
        rewards_claimed=campaign.rewards_claimed,
        conversion_rate_pct=conversion,
        rewards=[ReferralRewardResponse.model_validate(reward) for reward in rewards],
        created_at=campaign.created_at,
        updated_at=campaign.updated_at,
    )


@router.get("/governance/proposals", response_model=list[GovernanceProposalResponse])
async def list_proposals(
    status: Annotated[Optional[str], Query()] = None,
    limit: Annotated[int, Query(le=100)] = 50,
    db: AsyncSession = Depends(get_db),
):
    query = select(GovernanceProposal).order_by(GovernanceProposal.created_at.desc()).limit(limit)
    if status:
        query = query.where(GovernanceProposal.status == status.lower())
    result = await db.execute(query)
    return [_proposal_response(proposal) for proposal in result.scalars().all()]


@router.get("/governance/proposals/{proposal_id}", response_model=GovernanceProposalResponse)
async def get_proposal(proposal_id: str, db: AsyncSession = Depends(get_db)):
    try:
        proposal_uuid = uuid.UUID(proposal_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid proposal_id")

    result = await db.execute(
        select(GovernanceProposal).where(GovernanceProposal.id == proposal_uuid)
    )
    proposal = result.scalar_one_or_none()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return _proposal_response(proposal)


@router.post("/governance/proposals", response_model=GovernanceProposalResponse, status_code=201)
async def create_proposal(
    data: GovernanceProposalCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_api_key),
):
    stake = _STAKES.get(data.proposer, 0)
    outbound = _DELEGATIONS.get(data.proposer)
    if outbound or stake < PROPOSAL_THRESHOLD:
        raise HTTPException(status_code=403, detail="Insufficient voting power to create proposal")

    proposal = GovernanceProposal(
        onchain_id=data.onchain_id,
        title=data.title,
        description=data.description,
        proposer=data.proposer,
        status="active",
        voting_ends_at=data.voting_ends_at,
        executable_after=data.executable_after,
    )
    append_lifecycle_event(proposal, to_status="active", detail="proposal_created")
    db.add(proposal)
    await db.commit()
    await db.refresh(proposal)
    return _proposal_response(proposal)


@router.post("/governance/proposals/{proposal_id}/transitions", response_model=GovernanceProposalResponse)
async def transition_proposal(
    proposal_id: str,
    to_status: Annotated[str, Query()],
    detail: Annotated[str, Query()] = "status_transition",
    db: AsyncSession = Depends(get_db),
    _=Depends(require_api_key),
):
    try:
        proposal_uuid = uuid.UUID(proposal_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid proposal_id")

    result = await db.execute(
        select(GovernanceProposal).where(GovernanceProposal.id == proposal_uuid)
    )
    proposal = result.scalar_one_or_none()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    append_lifecycle_event(
        proposal,
        from_status=proposal.status,
        to_status=to_status.lower(),
        detail=detail,
    )
    await db.commit()
    await db.refresh(proposal)
    return _proposal_response(proposal)


@router.get("/governance/voting-power/{address}", response_model=VotingPowerBreakdown)
async def get_voting_power(address: str, proposal_id: Annotated[Optional[str], Query()] = None):
    outbound = _DELEGATIONS.get(address)
    delegated_stakes = {
        delegator: _STAKES.get(delegator, 0)
        for delegator, delegatee in _DELEGATIONS.items()
        if delegatee == address
    }
    breakdown = resolve_voting_power(
        address=address,
        self_stake=_STAKES.get(address, 0),
        delegated_stakes=delegated_stakes,
        outbound_delegatee=outbound,
        proposal_voters=set(),
    )
    return VotingPowerBreakdown(**breakdown)


@router.post("/governance/stakes/{address}")
async def set_voting_stake(
    address: str,
    balance: Annotated[int, Query(ge=0)],
    _=Depends(require_api_key),
):
    _STAKES[address] = balance
    return {"address": address, "balance": balance}


@router.post("/governance/delegations")
async def delegate_votes(
    delegator: Annotated[str, Query()],
    delegatee: Annotated[str, Query()],
    _=Depends(require_api_key),
):
    if delegator == delegatee:
        raise HTTPException(status_code=400, detail="Self-delegation is not allowed")
    _DELEGATIONS[delegator] = delegatee
    return {"delegator": delegator, "delegatee": delegatee}


@router.get("/referrals", response_model=list[ReferralCampaignResponse])
async def list_referrals(
    limit: Annotated[int, Query(le=100)] = 50,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ReferralCampaign).order_by(ReferralCampaign.created_at.desc()).limit(limit)
    )
    campaigns = result.scalars().all()
    responses = []
    for campaign in campaigns:
        rewards_result = await db.execute(
            select(ReferralReward)
            .where(ReferralReward.campaign_id == campaign.id)
            .order_by(ReferralReward.created_at.desc())
        )
        responses.append(_campaign_response(campaign, list(rewards_result.scalars().all())))
    return responses


@router.post("/referrals", response_model=ReferralCampaignResponse, status_code=201)
async def create_referral(
    data: ReferralCampaignCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_api_key),
):
    existing = await db.execute(select(ReferralCampaign).where(ReferralCampaign.code == data.code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Referral code already exists")

    campaign = ReferralCampaign(code=data.code.upper(), owner=data.owner)
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return _campaign_response(campaign, [])


@router.get("/referrals/{code}", response_model=ReferralCampaignResponse)
async def get_referral(code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ReferralCampaign).where(ReferralCampaign.code == code.upper()))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Referral code not found")

    rewards_result = await db.execute(
        select(ReferralReward)
        .where(ReferralReward.campaign_id == campaign.id)
        .order_by(ReferralReward.created_at.desc())
    )
    return _campaign_response(campaign, list(rewards_result.scalars().all()))


@router.get("/referrals/{code}/share", response_model=ReferralSharePayload)
async def get_referral_share(
    code: str,
    base_url: Annotated[Optional[str], Query()] = None,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ReferralCampaign).where(ReferralCampaign.code == code.upper()))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Referral code not found")

    payload = build_share_payload(campaign.code, campaign.owner, base_url)
    return ReferralSharePayload(**payload)


@router.post("/referrals/{code}/rewards", response_model=ReferralRewardResponse, status_code=201)
async def create_referral_reward(
    code: str,
    amount: Annotated[int, Query(gt=0)],
    swap_id: Annotated[Optional[int], Query()] = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_api_key),
):
    result = await db.execute(select(ReferralCampaign).where(ReferralCampaign.code == code.upper()))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Referral code not found")

    reward = await record_reward(db, campaign, swap_id=swap_id, amount=amount)
    await db.commit()
    await db.refresh(reward)
    return ReferralRewardResponse.model_validate(reward)


@router.post("/referrals/{code}/rewards/{reward_id}/settle", response_model=ReferralRewardResponse)
async def settle_referral_reward_endpoint(
    code: str,
    reward_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_api_key),
):
    try:
        reward_uuid = uuid.UUID(reward_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid reward_id")

    campaign_result = await db.execute(
        select(ReferralCampaign).where(ReferralCampaign.code == code.upper())
    )
    campaign = campaign_result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Referral code not found")

    reward_result = await db.execute(
        select(ReferralReward).where(
            ReferralReward.id == reward_uuid,
            ReferralReward.campaign_id == campaign.id,
        )
    )
    reward = reward_result.scalar_one_or_none()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")

    try:
        await settle_reward(db, campaign, reward)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))

    await db.commit()
    await db.refresh(reward)
    return ReferralRewardResponse.model_validate(reward)


@router.post("/referrals/{code}/claim", response_model=ReferralCampaignResponse)
async def claim_referral_rewards_endpoint(
    code: str,
    owner: Annotated[str, Query()],
    db: AsyncSession = Depends(get_db),
    _=Depends(require_api_key),
):
    campaign_result = await db.execute(
        select(ReferralCampaign).where(ReferralCampaign.code == code.upper())
    )
    campaign = campaign_result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Referral code not found")
    if campaign.owner != owner:
        raise HTTPException(status_code=403, detail="Only the referral owner can claim rewards")

    rewards_result = await db.execute(
        select(ReferralReward).where(ReferralReward.campaign_id == campaign.id)
    )
    rewards = list(rewards_result.scalars().all())
    try:
        await claim_rewards(db, campaign, rewards)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))

    await db.commit()
    await db.refresh(campaign)
    return _campaign_response(campaign, rewards)
