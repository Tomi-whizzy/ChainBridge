import base64
import io
import os
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import quote

import qrcode
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.protocol import ReferralCampaign, ReferralReward


def build_share_payload(code: str, owner: str, base_url: Optional[str] = None) -> dict:
    app_base = (base_url or os.getenv("CHAINBRIDGE_APP_URL", "https://app.chainbridge.io")).rstrip("/")
    qr_content = f"chainbridge://refer?code={quote(code)}&owner={quote(owner)}"
    share_url = f"{app_base}/swap?ref={quote(code)}"

    qr = qrcode.QRCode(box_size=6, border=2)
    qr.add_data(qr_content)
    qr.make(fit=True)
    image = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    qr_image_base64 = base64.b64encode(buffer.getvalue()).decode("ascii")

    return {
        "code": code,
        "owner": owner,
        "qr_content": qr_content,
        "share_url": share_url,
        "qr_image_base64": qr_image_base64,
        "created_at": datetime.now(timezone.utc),
    }


async def record_reward(
    db: AsyncSession,
    campaign: ReferralCampaign,
    *,
    swap_id: Optional[int],
    amount: int,
) -> ReferralReward:
    reward = ReferralReward(
        campaign_id=campaign.id,
        code=campaign.code,
        swap_id=swap_id,
        amount=amount,
        status="pending",
    )
    campaign.uses += 1
    campaign.rewards_earned += amount
    campaign.rewards_pending += amount
    if swap_id is not None:
        campaign.last_swap_id = swap_id
    db.add(reward)
    await db.flush()
    return reward


async def settle_reward(db: AsyncSession, campaign: ReferralCampaign, reward: ReferralReward) -> None:
    if reward.status != "pending":
        raise ValueError("reward_not_pending")
    if campaign.rewards_pending < reward.amount:
        raise ValueError("insufficient_pending_balance")

    reward.status = "settled"
    reward.settled_at = datetime.now(timezone.utc)
    campaign.rewards_pending -= reward.amount
    campaign.rewards_settled += reward.amount


async def claim_rewards(db: AsyncSession, campaign: ReferralCampaign, rewards: list[ReferralReward]) -> int:
    if campaign.rewards_settled <= 0:
        raise ValueError("nothing_to_claim")

    claimable = campaign.rewards_settled
    now = datetime.now(timezone.utc)
    for reward in rewards:
        if reward.status == "settled":
            reward.status = "claimed"
            reward.claimed_at = now

    campaign.rewards_claimed += claimable
    campaign.rewards_settled = 0
    return claimable
