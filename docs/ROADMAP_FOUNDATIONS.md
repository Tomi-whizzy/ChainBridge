# Roadmap Foundations

This document describes the first integrated implementation pass for the following roadmap issues:

- Issue #80: Governance DAO structure
- Issue #79: Liquidity pool integration
- Issue #78: Advanced order types
- Issue #77: Swap sharing and referral system

## Scope

The current branch adds protocol-level foundations instead of a fully productionized DAO, AMM, referral engine, and advanced matching stack. The goal is to establish shared primitives across the smart contract and frontend so later issue-specific work can iterate on a stable interface.

## Governance

- `GovernanceConfig` stores the DAO token symbol, quorum settings, proposal threshold, voting window, and execution timelock.
- `GovernanceProposal` tracks proposer, proposal actions, vote counts, voting deadline, and execution readiness.
- Delegation support is modeled with `DelegationRecord`.
- Contract methods now support proposal creation, voting, delegation, retrieval, and execution.

## Liquidity Pools

- `LiquidityPool` models a two-asset pool with reserves, LP supply, fee tier, and reward rate.
- `LiquidityPosition` tracks LP token balances and accrued rewards per provider.
- Contract methods now support pool creation, liquidity deposits, pool retrieval, position retrieval, and quote calculation for direct pool routes.

## Advanced Orders

- `SwapOrder` now includes:
  - `order_type`
  - `execution`
  - `amendment_count`
- `OrderExecutionCondition` provides a minimal structure for trigger pricing, time-based execution, and partial-fill permissions.
- Contract methods now support advanced order creation and amendments.

## Referrals and Sharing

- `ReferralRecord` tracks referral-code ownership, usage count, last swap usage, and rewards earned.
- Contract methods now support referral-code registration and referral usage accounting.
- The frontend exposes these capabilities from the swap flow and a dedicated protocol workspace.

## Frontend Surfaces

- `/protocol` consolidates governance, liquidity, advanced orders, and referral analytics.
- `/swap` now exposes advanced execution mode selection and links into governance/liquidity/referral workflows.
- The main navigation and landing page highlight the new protocol capabilities.

## Follow-Up Work

- Replace mock frontend data with API-backed state.
- Support multi-hop and best-price routing across several pools plus the order book.
- Add dedicated unit and integration tests for edge cases around execution conditions.

## Governance Voting Power

Effective voting power is computed deterministically on-chain and mirrored in the API:

- `effective_power = self_power + delegated_in`
- `self_power` is zero when the voter has an active outbound delegation.
- `delegated_in` sums stake from delegators whose latest delegation targets the voter and who have not yet voted on the proposal.
- Proposal creation requires `self_power >= proposal_threshold`; delegated power cannot be used to meet the threshold.
- Quorum is `total_voting_supply * quorum_bps / 10_000`.

Edge cases:

- **Self-delegation**: rejected at delegation time.
- **Double counting**: a delegator who delegated away cannot vote directly; their stake is counted only once through the delegatee.
- **Stale delegation records**: only the latest delegation record for a delegator is honored; re-delegation removes the delegator from the previous delegatee index.

## Proposal Lifecycle

Each proposal stores an append-only lifecycle log. Status transitions (`active`, `succeeded`, `defeated`, `executed`) are persisted and returned through the protocol API for timeline rendering.

## Referral Sharing and Settlement

Referral share payloads include:

- `qr_content`: deep link for mobile scanners (`chainbridge://refer?...`)
- `share_url`: fallback web link for clients without QR support
- `qr_image_base64`: PNG QR encoding of `qr_content`

Referral rewards move through `pending` → `settled` → `claimed`. Campaign balances keep `rewards_pending`, `rewards_settled`, and `rewards_claimed` in sync after settlement and payout execution.
