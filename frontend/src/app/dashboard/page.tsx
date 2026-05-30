"use client";

import { useState } from "react";
import { Button, Input, CopyButton } from "@/components/ui";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { RefreshCw, Wallet, Globe, Activity } from "lucide-react";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { PortfolioChainsSection } from "@/components/dashboard/PortfolioChainsSection";
import { RecentSwapsPreview } from "@/components/dashboard/RecentSwapsPreview";
import { useWalletStore } from "@/hooks/useWallet";
import { useSettingsStore } from "@/hooks/useSettings";
import { useSwapHistoryStore } from "@/hooks/useSwapHistory";
import { useToast } from "@/hooks/useToast";

export default function DashboardPage() {
  const breadcrumbs = useBreadcrumbs();
  const { address, isConnected } = useWalletStore();
  const networkMode = useSettingsStore((s) => s.settings.network.mode);
  const swapCount = useSwapHistoryStore((s) => s.swaps.length);
  const { success } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState({ displayName: "", email: "" });
  const isDirty = displayName !== saved.displayName || email !== saved.email;

  function handleSave() {
    setSaved({ displayName, email });
    success("Profile saved");
  }

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

      <PortfolioChainsSection />
      <RecentSwapsPreview />

      {/* Issue #401 — wallet summary replaces placeholder profile card */}
      <div className="rounded-xl border border-border bg-surface-overlay p-6 space-y-4">
        <h2 className="text-xl font-semibold text-text-primary">Wallet Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 rounded-lg bg-surface-raised p-4">
            <Wallet className="h-5 w-5 text-brand-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-text-muted">Address</p>
              {isConnected && address ? (
                <div className="flex items-center gap-1">
                  <span className="truncate text-sm font-medium text-text-primary">
                    {address.slice(0, 8)}…{address.slice(-6)}
                  </span>
                  <CopyButton value={address} />
                </div>
              ) : (
                <span className="text-sm text-text-secondary">Not connected</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-surface-raised p-4">
            <Globe className="h-5 w-5 text-brand-500 shrink-0" />
            <div>
              <p className="text-xs text-text-muted">Network</p>
              <span className="text-sm font-medium text-text-primary capitalize">{networkMode}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-surface-raised p-4">
            <Activity className="h-5 w-5 text-brand-500 shrink-0" />
            <div>
              <p className="text-xs text-text-muted">Swaps</p>
              <span className="text-sm font-medium text-text-primary">{swapCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Issue #402 — single save action, disabled until changes are made */}
      <div className="rounded-xl border border-border bg-surface-overlay p-6 space-y-6">
        <h2 className="text-xl font-semibold text-text-primary">Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Display Name"
            placeholder="e.g. Satoshi"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Input
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <Button variant="primary" size="sm" disabled={!isDirty} onClick={handleSave}>
            Save Changes
          </Button>
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
