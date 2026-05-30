use crate::error::Error;
use crate::storage;
use crate::types::{ReferralRecord, ReferralRewardEntry, ReferralRewardStatus};
use soroban_sdk::{Address, Env, String, Vec};

pub fn register_referral_code(env: &Env, owner: &Address, code: String) -> Result<(), Error> {
    if code.len() < 4 {
        return Err(Error::InvalidAmount);
    }
    if storage::read_referral_record(env, &code).is_some() {
        return Err(Error::AlreadyInitialized);
    }

    let record = ReferralRecord {
        owner: owner.clone(),
        code: code.clone(),
        uses: 0,
        rewards_earned: 0,
        rewards_pending: 0,
        rewards_settled: 0,
        rewards_claimed: 0,
        last_swap_id: 0,
    };
    storage::write_referral_record(env, &record);
    Ok(())
}

pub fn record_referral_swap(
    env: &Env,
    code: String,
    swap_id: u64,
    notional_amount: i128,
) -> Result<u64, Error> {
    let mut record = storage::read_referral_record(env, &code).ok_or(Error::OrderNotFound)?;
    let reward_amount = notional_amount / 100;
    let now = env.ledger().timestamp();
    let reward_id = storage::increment_referral_reward_counter(env);

    let entry = ReferralRewardEntry {
        id: reward_id,
        code: code.clone(),
        swap_id,
        amount: reward_amount,
        status: ReferralRewardStatus::Pending,
        created_at: now,
        settled_at: 0,
        claimed_at: 0,
    };
    storage::write_referral_reward(env, &entry);

    record.uses += 1;
    record.last_swap_id = swap_id;
    record.rewards_earned += reward_amount;
    record.rewards_pending += reward_amount;
    storage::write_referral_record(env, &record);
    Ok(reward_id)
}

pub fn settle_referral_reward(env: &Env, reward_id: u64) -> Result<(), Error> {
    let mut entry = storage::read_referral_reward(env, reward_id).ok_or(Error::OrderNotFound)?;
    if entry.status != ReferralRewardStatus::Pending {
        return Err(Error::OrderAlreadyMatched);
    }

    let mut record = storage::read_referral_record(env, &entry.code).ok_or(Error::OrderNotFound)?;
    if record.rewards_pending < entry.amount {
        return Err(Error::InvalidAmount);
    }

    entry.status = ReferralRewardStatus::Settled;
    entry.settled_at = env.ledger().timestamp();
    storage::write_referral_reward(env, &entry);

    record.rewards_pending -= entry.amount;
    record.rewards_settled += entry.amount;
    storage::write_referral_record(env, &record);
    Ok(())
}

pub fn claim_referral_rewards(env: &Env, owner: &Address, code: String) -> Result<i128, Error> {
    let mut record = storage::read_referral_record(env, &code).ok_or(Error::OrderNotFound)?;
    if record.owner != *owner {
        return Err(Error::Unauthorized);
    }
    if record.rewards_settled <= 0 {
        return Err(Error::Unauthorized);
    }

    let claimable = record.rewards_settled;
    let now = env.ledger().timestamp();
    let total = storage::get_referral_reward_counter(env);
    for reward_id in 1..=total {
        if let Some(mut entry) = storage::read_referral_reward(env, reward_id) {
            if entry.code == code && entry.status == ReferralRewardStatus::Settled {
                entry.status = ReferralRewardStatus::Claimed;
                entry.claimed_at = now;
                storage::write_referral_reward(env, &entry);
            }
        }
    }

    record.rewards_settled = 0;
    record.rewards_claimed += claimable;
    storage::write_referral_record(env, &record);
    Ok(claimable)
}

pub fn get_referral_rewards(env: &Env, code: String) -> Vec<ReferralRewardEntry> {
    let total = storage::get_referral_reward_counter(env);
    let mut rewards = Vec::new(env);
    for reward_id in 1..=total {
        if let Some(entry) = storage::read_referral_reward(env, reward_id) {
            if entry.code == code {
                rewards.push_back(entry);
            }
        }
    }
    rewards
}
