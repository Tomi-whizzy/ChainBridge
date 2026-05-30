"""Tests for protocol governance and referral services."""

from app.services.governance import resolve_voting_power
from app.services.referral import build_share_payload


def test_governance_voting_power_breakdown():
    breakdown = resolve_voting_power(
        address="delegatee",
        self_stake=200,
        delegated_stakes={"delegator": 300},
        outbound_delegatee=None,
        proposal_voters=set(),
    )
    assert breakdown["effective_power"] == 500
    assert breakdown["self_power"] == 200
    assert breakdown["delegated_in"] == 300


def test_governance_outbound_delegation_zeroes_self_power():
    breakdown = resolve_voting_power(
        address="delegator",
        self_stake=300,
        delegated_stakes={},
        outbound_delegatee="delegatee",
        proposal_voters=set(),
    )
    assert breakdown["self_power"] == 0
    assert breakdown["effective_power"] == 0


def test_referral_share_payload_shape():
    payload = build_share_payload("FROST", "0xabc", "https://app.test")
    assert payload["qr_content"].startswith("chainbridge://refer?")
    assert payload["share_url"] == "https://app.test/swap?ref=FROST"
    assert payload["qr_image_base64"]
