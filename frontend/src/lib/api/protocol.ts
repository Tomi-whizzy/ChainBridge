import { createApiClient } from "@/lib/api/client";
import type { GovernanceProposal, ProposalLifecycleEvent, ReferralCampaign } from "@/types";

const protocolClient = createApiClient({ basePath: "/protocol" });

interface ApiProposalLifecycleEvent {
  sequence: number;
  from_status?: string | null;
  to_status: string;
  occurred_at: string;
  detail: string;
}

interface ApiGovernanceProposal {
  id: string;
  title: string;
  proposer: string;
  status: GovernanceProposal["status"];
  participation_pct: number;
  executable_after?: string | null;
  lifecycle: ApiProposalLifecycleEvent[];
}

interface ApiReferralReward {
  id: string;
  amount: number;
  status: "pending" | "settled" | "claimed";
}

interface ApiReferralCampaign {
  code: string;
  uses: number;
  rewards_earned: number;
  rewards_pending: number;
  rewards_settled: number;
  rewards_claimed: number;
  conversion_rate_pct: number;
  rewards: ApiReferralReward[];
}

interface ApiReferralSharePayload {
  code: string;
  share_url: string;
  qr_image_base64: string;
}

function mapProposal(proposal: ApiGovernanceProposal): GovernanceProposal {
  return {
    id: proposal.id,
    title: proposal.title,
    proposer: proposal.proposer,
    status: proposal.status,
    participation: `${proposal.participation_pct}%`,
    executableAt: proposal.executable_after
      ? new Date(proposal.executable_after).toLocaleString()
      : "Pending",
    lifecycle: proposal.lifecycle.map(
      (event): ProposalLifecycleEvent => ({
        sequence: event.sequence,
        from_status: event.from_status,
        to_status: event.to_status,
        occurred_at: event.occurred_at,
        detail: event.detail,
      })
    ),
  };
}

function formatReward(amount: number): string {
  return `$${(amount / 100).toFixed(0)}`;
}

function mapReferral(campaign: ApiReferralCampaign, share?: ApiReferralSharePayload): ReferralCampaign {
  return {
    code: campaign.code,
    referrals: campaign.uses,
    rewards: formatReward(campaign.rewards_earned),
    conversionRate: `${campaign.conversion_rate_pct}%`,
    rewardsPending: formatReward(campaign.rewards_pending),
    rewardsSettled: formatReward(campaign.rewards_settled),
    rewardsClaimed: formatReward(campaign.rewards_claimed),
    shareUrl: share?.share_url,
    qrImageBase64: share?.qr_image_base64,
  };
}

export async function listGovernanceProposals(): Promise<GovernanceProposal[]> {
  const proposals = await protocolClient.get<ApiGovernanceProposal[]>("/governance/proposals");
  return proposals.map(mapProposal);
}

export async function listReferralCampaigns(): Promise<ReferralCampaign[]> {
  const campaigns = await protocolClient.get<ApiReferralCampaign[]>("/referrals");
  const enriched = await Promise.all(
    campaigns.map(async (campaign) => {
      try {
        const share = await protocolClient.get<ApiReferralSharePayload>(
          `/referrals/${campaign.code}/share`
        );
        return mapReferral(campaign, share);
      } catch {
        return mapReferral(campaign);
      }
    })
  );
  return enriched;
}
