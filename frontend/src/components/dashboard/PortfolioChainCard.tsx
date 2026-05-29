"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChainIcon } from "@/components/ui/ChainIcon";
import { StatusDot } from "@/components/ui/StatusBadge";
import { cn, formatAmount } from "@/lib/utils";
import { TrendingUp, TrendingDown, Activity, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export interface ChainAsset {
  symbol: string;
  name: string;
  balance: string;
  valueUsd: number;
  change24h?: number;
}

export interface PortfolioChainData {
  chain: string;
  chainName: string;
  status: "operational" | "degraded" | "down";
  totalValueUsd: number;
  change24h?: number;
  assets: ChainAsset[];
  activeSwaps?: number;
  pendingTransactions?: number;
}

interface PortfolioChainCardProps {
  data: PortfolioChainData;
  onClick?: () => void;
  className?: string;
}

export function PortfolioChainCard({ data, onClick, className }: PortfolioChainCardProps) {
  const {
    chain,
    chainName,
    status,
    totalValueUsd,
    change24h,
    assets,
    activeSwaps,
    pendingTransactions,
  } = data;

  const isPositiveChange = change24h !== undefined && change24h >= 0;
  const hasActivity = (activeSwaps ?? 0) > 0 || (pendingTransactions ?? 0) > 0;

  const statusVariant = {
    operational: "success" as const,
    degraded: "warning" as const,
    down: "error" as const,
  }[status];

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200",
        onClick && "cursor-pointer hover:-translate-y-1 hover:shadow-glow-md",
        className
      )}
      onClick={onClick}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-brand-500/5 opacity-0 transition-opacity group-hover:opacity-100" />

      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-surface-overlay p-2.5">
              <ChainIcon chain={chain} size="lg" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">{chainName}</h3>
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <StatusDot variant={statusVariant} size="sm" />
                <span className="capitalize">{status}</span>
              </div>
            </div>
          </div>

          {onClick && (
            <ArrowUpRight className="h-5 w-5 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Total Value */}
        <div>
          <div className="text-2xl font-bold text-text-primary">
            ${formatAmount(totalValueUsd, 2)}
          </div>
          {change24h !== undefined && (
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium",
                isPositiveChange ? "text-emerald-400" : "text-red-400"
              )}
            >
              {isPositiveChange ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>
                {isPositiveChange ? "+" : ""}
                {change24h.toFixed(2)}%
              </span>
              <span className="text-text-muted">24h</span>
            </div>
          )}
        </div>

        {/* Assets List */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-text-muted">Assets</div>
          <div className="space-y-1.5">
            {assets.slice(0, 3).map((asset) => (
              <div
                key={asset.symbol}
                className="flex items-center justify-between rounded-lg bg-surface-overlay px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary">{asset.symbol}</span>
                  <span className="text-xs text-text-muted">{asset.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-text-primary">
                    {formatAmount(asset.balance)}
                  </div>
                  <div className="text-xs text-text-muted">${formatAmount(asset.valueUsd, 2)}</div>
                </div>
              </div>
            ))}
            {assets.length > 3 && (
              <div className="text-center text-xs text-text-muted">
                +{assets.length - 3} more assets
              </div>
            )}
          </div>
        </div>

        {/* Activity Indicators */}
        {hasActivity && (
          <div className="flex items-center gap-4 border-t border-border pt-3">
            {activeSwaps !== undefined && activeSwaps > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-brand-500" />
                <span className="text-text-secondary">
                  {activeSwaps} active swap{activeSwaps !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {pendingTransactions !== undefined && pendingTransactions > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <StatusDot variant="pending" size="sm" pulse />
                <span className="text-text-secondary">{pendingTransactions} pending</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Grid container for portfolio chain cards
 */
interface PortfolioChainGridProps {
  chains: PortfolioChainData[];
  onChainClick?: (chain: string) => void;
  className?: string;
}

export function PortfolioChainGrid({ chains, onChainClick, className }: PortfolioChainGridProps) {
  return (
    <div className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>
      {chains.map((chainData) => (
        <PortfolioChainCard
          key={chainData.chain}
          data={chainData}
          onClick={onChainClick ? () => onChainClick(chainData.chain) : undefined}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton loader for portfolio chain cards
 */
export function PortfolioChainCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 animate-pulse rounded-xl bg-surface-overlay" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-24 animate-pulse rounded bg-surface-overlay" />
            <div className="h-4 w-20 animate-pulse rounded bg-surface-overlay" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="h-8 w-32 animate-pulse rounded bg-surface-overlay" />
          <div className="h-4 w-24 animate-pulse rounded bg-surface-overlay" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-overlay" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
