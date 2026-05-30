"use client";

import { Badge, Button, Card, CardContent, CardHeader } from "@/components/ui";
import { ActivityTimeline, type ActivityTimelineEvent } from "@/components/timeline/ActivityTimeline";
import { listGovernanceProposals, listReferralCampaigns } from "@/lib/api/protocol";
import type { GovernanceProposal, ReferralCampaign } from "@/types";
import { Coins, Gauge, GitBranchPlus, Share2, Vote } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

const ORDER_MODES = [
  "Limit orders with conditional execution",
  "TWAP scheduling for large swaps",
  "Partial fill controls and amendments",
  "Expiry windows and stop-loss triggers",
];

const FALLBACK_PROPOSALS: GovernanceProposal[] = [
  {
    id: "GP-80",
    title: "Move protocol parameters under DAO control",
    proposer: "0x8e4a...1f19",
    status: "active",
    participation: "24.8%",
    executableAt: "In 2 days",
    lifecycle: [
      {
        sequence: 1,
        to_status: "active",
        occurred_at: new Date().toISOString(),
        detail: "proposal_created",
      },
    ],
  },
];

const FALLBACK_REFERRALS: ReferralCampaign[] = [
  {
    code: "FROST",
    referrals: 18,
    rewards: "$412",
    conversionRate: "22%",
    rewardsPending: "$120",
    rewardsSettled: "$177",
    rewardsClaimed: "$115",
  },
];

function lifecycleToTimeline(proposal: GovernanceProposal): ActivityTimelineEvent[] {
  return (proposal.lifecycle ?? []).map((event) => ({
    id: `${proposal.id}-${event.sequence}`,
    label: event.detail.replaceAll("_", " "),
    timestamp: event.occurred_at,
    status: event.to_status === "defeated" ? "failed" : "confirmed",
    description: event.from_status
      ? `${event.from_status} → ${event.to_status}`
      : `Status: ${event.to_status}`,
  }));
}

export default function ProtocolPage() {
  const [proposals, setProposals] = useState<GovernanceProposal[]>(FALLBACK_PROPOSALS);
  const [referrals, setReferrals] = useState<ReferralCampaign[]>(FALLBACK_REFERRALS);
  const [selectedProposalId, setSelectedProposalId] = useState<string>(FALLBACK_PROPOSALS[0]?.id ?? "");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProtocolData() {
      try {
        const [proposalData, referralData] = await Promise.all([
          listGovernanceProposals(),
          listReferralCampaigns(),
        ]);
        if (!active) return;
        if (proposalData.length) {
          setProposals(proposalData);
          setSelectedProposalId(proposalData[0].id);
        }
        if (referralData.length) {
          setReferrals(referralData);
        }
        setLoadError(null);
      } catch {
        if (active) {
          setLoadError("Showing cached protocol data while the API is unavailable.");
        }
      }
    }

    void loadProtocolData();
    return () => {
      active = false;
    };
  }, []);

  const selectedProposal = useMemo(
    () => proposals.find((proposal) => proposal.id === selectedProposalId) ?? proposals[0],
    [proposals, selectedProposalId]
  );

  const activeProposals = proposals.filter((proposal) => proposal.status === "active").length;
  const referralRevenue = referrals.reduce((sum, campaign) => {
    const numeric = Number(campaign.rewards.replace(/[^\d]/g, ""));
    return sum + (Number.isFinite(numeric) ? numeric : 0);
  }, 0);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 md:py-16">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="info" className="mb-3">
            Protocol Workspace
          </Badge>
          <h1 className="text-3xl font-bold text-text-primary md:text-5xl">
            Protocol Control Room
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-text-secondary md:text-base">
            Governance lifecycle history, referral settlement tracking, and shareable onboarding
            payloads in one operator view.
          </p>
          {loadError && <p className="mt-2 text-sm text-amber-400">{loadError}</p>}
        </div>
        <div className="flex gap-3">
          <Button className="rounded-xl">Launch Governance</Button>
          <Button variant="secondary" className="rounded-xl">
            Create Referral Campaign
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <MetricCard
          icon={<Vote className="h-5 w-5" />}
          label="Active Proposals"
          value={String(activeProposals)}
          detail={`${proposals.length} tracked proposals`}
        />
        <MetricCard
          icon={<Coins className="h-5 w-5" />}
          label="Pool TVL"
          value="$2.10M"
          detail="Across instant-routing pools"
        />
        <MetricCard
          icon={<GitBranchPlus className="h-5 w-5" />}
          label="Order Modes"
          value="4"
          detail="Limit, TWAP, stop, partial fill"
        />
        <MetricCard
          icon={<Share2 className="h-5 w-5" />}
          label="Referral Revenue"
          value={`$${referralRevenue}`}
          detail="Tracked pending, settled, and claimed"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card variant="raised">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Governance Queue</h2>
              <p className="text-sm text-text-secondary">
                Proposal status transitions are persisted and exposed through the protocol API.
              </p>
            </div>
            <Badge variant="success">DAO Ready</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {proposals.map((proposal) => (
              <button
                key={proposal.id}
                type="button"
                onClick={() => setSelectedProposalId(proposal.id)}
                className="w-full rounded-2xl border border-border bg-surface-overlay/40 p-4 text-left transition hover:border-brand-500/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{proposal.title}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {proposal.id} by {proposal.proposer}
                    </p>
                  </div>
                  <Badge variant={proposal.status === "active" ? "info" : "success"}>
                    {proposal.status}
                  </Badge>
                </div>
                <div className="mt-3 flex gap-6 text-xs text-text-secondary">
                  <span>Participation: {proposal.participation}</span>
                  <span>Execution: {proposal.executableAt}</span>
                </div>
              </button>
            ))}

            {selectedProposal && (
              <ActivityTimeline
                title="Proposal Lifecycle"
                events={lifecycleToTimeline(selectedProposal)}
                emptyMessage="No lifecycle events recorded yet."
              />
            )}
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <h2 className="text-xl font-semibold text-text-primary">Advanced Order Stack</h2>
            <p className="text-sm text-text-secondary">
              Extend the existing swap flow with richer execution intent.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {ORDER_MODES.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-border bg-background/50 px-4 py-3 text-sm text-text-secondary"
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card variant="raised">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Liquidity Routing</h2>
              <p className="text-sm text-text-secondary">
                Fallback AMM pools backstop the order book when direct liquidity thins out.
              </p>
            </div>
            <Gauge className="h-5 w-5 text-brand-500" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-surface-overlay/40 p-4 text-sm md:grid-cols-5">
              <span className="font-semibold text-text-primary">XLM/USDC</span>
              <span className="text-text-secondary">TVL $1.24M</span>
              <span className="text-text-secondary">APR 14.2%</span>
              <span className="text-text-secondary">Fee 0.30%</span>
              <span className="text-text-secondary">Utilization 68%</span>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <h2 className="text-xl font-semibold text-text-primary">Referral Analytics</h2>
            <p className="text-sm text-text-secondary">
              QR-friendly share payloads, settlement status, and fallback links for onboarding.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {referrals.map((campaign) => (
              <div
                key={campaign.code}
                className="rounded-2xl border border-border bg-background/50 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-text-primary">{campaign.code}</p>
                    <p className="text-xs text-text-muted">
                      {campaign.referrals} successful referrals
                    </p>
                    <div className="mt-2 grid gap-1 text-xs text-text-secondary">
                      <span>Pending: {campaign.rewardsPending ?? "—"}</span>
                      <span>Settled: {campaign.rewardsSettled ?? "—"}</span>
                      <span>Claimed: {campaign.rewardsClaimed ?? "—"}</span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-text-secondary">
                    <p>{campaign.rewards}</p>
                    <p>{campaign.conversionRate} conversion</p>
                  </div>
                </div>

                {campaign.qrImageBase64 && (
                  <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                    <img
                      src={`data:image/png;base64,${campaign.qrImageBase64}`}
                      alt={`Referral QR for ${campaign.code}`}
                      className="h-28 w-28 rounded-xl border border-border bg-white p-2"
                    />
                    {campaign.shareUrl && (
                      <a
                        href={campaign.shareUrl}
                        className="text-sm text-brand-500 underline underline-offset-4"
                      >
                        Open fallback share link
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card variant="glass" className="p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold text-text-primary">{value}</p>
      <p className="mt-2 text-sm text-text-secondary">{detail}</p>
    </Card>
  );
}
