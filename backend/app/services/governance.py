from datetime import datetime, timezone
from typing import Optional

from app.models.protocol import GovernanceProposal


def append_lifecycle_event(
    proposal: GovernanceProposal,
    *,
    to_status: str,
    detail: str,
    from_status: Optional[str] = None,
) -> None:
    existing = list(proposal.lifecycle_log or [])
    sequence = len(existing) + 1
    entry = {
        "sequence": sequence,
        "from_status": from_status,
        "to_status": to_status,
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "detail": detail,
    }
    proposal.lifecycle_log = [*existing, entry]
    proposal.status = to_status


def resolve_voting_power(
    *,
    address: str,
    self_stake: int,
    delegated_stakes: dict[str, int],
    outbound_delegatee: Optional[str],
    proposal_voters: set[str],
) -> dict:
    self_power = 0 if outbound_delegatee else self_stake
    delegated_in = sum(
        stake
        for delegator, stake in delegated_stakes.items()
        if delegator not in proposal_voters
    )
    effective = self_power + delegated_in
    return {
        "address": address,
        "self_power": self_power,
        "delegated_in": delegated_in,
        "effective_power": effective,
        "has_outbound_delegation": outbound_delegatee is not None,
    }


def meets_proposal_threshold(self_stake: int, threshold: int, has_outbound_delegation: bool) -> bool:
    if has_outbound_delegation:
        return False
    return self_stake >= threshold


def quorum_target(total_voting_supply: int, quorum_bps: int) -> int:
    return total_voting_supply * quorum_bps // 10_000


def participation_pct(
    for_votes: int,
    against_votes: int,
    abstain_votes: int,
    total_voting_supply: int,
) -> float:
    if total_voting_supply <= 0:
        return 0.0
    total = for_votes + against_votes + abstain_votes
    return round((total / total_voting_supply) * 100, 1)
