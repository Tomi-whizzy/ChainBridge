"use client";

import Link from "next/link";
import { ArrowRightLeft, ArrowUpRight } from "lucide-react";

import { Card, EmptyState, StatusBadge } from "@/components/ui";
import { useSwapHistoryStore } from "@/hooks/useSwapHistory";

const PREVIEW_LIMIT = 3;

function formatRelative(dateString: string) {
  const then = new Date(dateString).getTime();
  if (Number.isNaN(then)) return dateString;
  const diffMs = Date.now() - then;
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `${diffD}d ago`;
  return new Date(then).toLocaleDateString();
}

/**
 * Issue #404 — dashboard recent-swaps preview.
 *
 * Reads the persisted swap-history store and surfaces the most recent
 * `PREVIEW_LIMIT` items so the dashboard reflects user activity instead of
 * acting like a profile form. Empty state links to `/swap` so a user with
 * no history can start one; the heading "View all" link routes to
 * `/tracking`.
 */
export function RecentSwapsPreview() {
  const swaps = useSwapHistoryStore((state) => state.swaps);
  const recent = swaps.slice(0, PREVIEW_LIMIT);

  return (
    <section
      aria-labelledby="dashboard-recent-swaps"
      className="rounded-xl border border-border bg-surface-overlay p-6 space-y-4"
    >
      <header className="flex items-center justify-between gap-2">
        <div>
          <h2
            id="dashboard-recent-swaps"
            className="text-xl font-semibold text-text-primary"
          >
            Recent Swaps
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Your most recent {PREVIEW_LIMIT} cross-chain swaps.
          </p>
        </div>
        <Link
          href="/tracking"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-400"
        >
          View all
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>

      {recent.length === 0 ? (
        <EmptyState
          icon={<ArrowRightLeft className="h-6 w-6" aria-hidden="true" />}
          title="No swaps yet"
          description="Start your first cross-chain swap to see it appear here."
          action={{ label: "Start a swap", href: "/swap" }}
        />
      ) : (
        <ul className="space-y-3">
          {recent.map((swap) => (
            <li key={swap.id}>
              <Card
                variant="raised"
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">
                    {swap.amount} {swap.from}{" "}
                    <span className="text-text-muted">to</span>{" "}
                    {swap.toAmount} {swap.to}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {formatRelative(swap.date)}
                  </p>
                </div>
                <StatusBadge swapStatus={swap.status} size="sm" />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
