"use client";

import { Button, Input, Select, CopyButton } from "@/components/ui";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { RefreshCw } from "lucide-react";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { PortfolioChainsSection } from "@/components/dashboard/PortfolioChainsSection";
import { RecentSwapsPreview } from "@/components/dashboard/RecentSwapsPreview";

export default function DashboardPage() {
  const breadcrumbs = useBreadcrumbs();

  return (
    <div className="space-y-8">
      <PageHeader
        title="User Dashboard"
        subtitle="Manage your profile, preferences, and view your swap history"
        breadcrumbs={breadcrumbs}
        secondaryActions={[
          <Button key="refresh" variant="secondary" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>,
        ]}
      />

      {/* Issue #405 — surfaces the existing PortfolioChainCard component
          (previously orphaned) so the dashboard leads with portfolio
          context rather than a profile form. */}
      <PortfolioChainsSection />

      {/* Issue #404 — recent swap-history preview. Reads from the
          persisted swap-history store and links out to `/tracking`. */}
      <RecentSwapsPreview />

      <div className="rounded-xl border border-border bg-surface-overlay p-6 space-y-6">
        <h2 className="text-xl font-semibold text-text-primary">Profile</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Wallet Address"
            disabled
            value="0x123...abc"
            rightElement={<CopyButton value={"0x123...abc"} />}
          />
          <Input label="Display Name" placeholder="e.g. Satoshi" />
          <Input label="Email" placeholder="your@email.com" />
        </div>
      </div>

      <Link
        href="/settings"
        className="rounded-xl border border-border bg-surface-overlay p-6 block hover:border-brand-500/50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Preferences</h2>
            <p className="text-sm text-text-secondary mt-1">
              Manage theme, notifications, and network settings
            </p>
          </div>
          <Button variant="secondary" size="sm">
            Open Settings
          </Button>
        </div>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/notifications"
          className="rounded-xl border border-border bg-surface-overlay p-5 block"
        >
          <h3 className="text-lg font-semibold text-text-primary">Notifications Center</h3>
          <p className="text-sm text-text-secondary mt-1">
            View alert history, filter by type, and mark updates as read.
          </p>
        </Link>
        <Link
          href="/analytics"
          className="rounded-xl border border-border bg-surface-overlay p-5 block"
        >
          <h3 className="text-lg font-semibold text-text-primary">Analytics</h3>
          <p className="text-sm text-text-secondary mt-1">
            Track swap volume across 24h, 7d, and 30d chart windows.
          </p>
        </Link>
      </div>
    </div>
  );
}
