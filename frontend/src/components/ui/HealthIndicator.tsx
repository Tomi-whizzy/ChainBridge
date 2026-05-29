"use client";

import { useHealthStatus, HealthStatus } from "@/hooks/useHealthStatus";
import { cn } from "@/lib/utils";
import { Activity, CheckCircle2, AlertTriangle, XCircle, HelpCircle, RefreshCw } from "lucide-react";

const healthConfig: Record<
  HealthStatus,
  { icon: typeof CheckCircle2; color: string; bg: string; label: string }
> = {
  healthy: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    label: "Healthy",
  },
  degraded: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    label: "Degraded",
  },
  unhealthy: {
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    label: "Unhealthy",
  },
  unknown: {
    icon: HelpCircle,
    color: "text-gray-400",
    bg: "bg-gray-500/10",
    label: "Unknown",
  },
};

interface HealthIndicatorProps {
  className?: string;
  showApiHealth?: boolean;
  showChainHealth?: boolean;
}

export function HealthIndicator({
  className,
  showApiHealth = true,
  showChainHealth = true,
}: HealthIndicatorProps) {
  const { chainHealth, apiHealth, isLoading, refresh } = useHealthStatus();

  const hasIssues =
    chainHealth.some((c) => c.status !== "healthy") || apiHealth?.status !== "healthy";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* API Health Indicator */}
      {showApiHealth && apiHealth && (
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
              healthConfig[apiHealth.status].bg,
              healthConfig[apiHealth.status].color
            )}
            title={`API Status: ${apiHealth.status}${apiHealth.latency ? ` (${apiHealth.latency}ms)` : ""}`}
          >
            {isLoading ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              (() => {
                const Icon = healthConfig[apiHealth.status].icon;
                return <Icon className="h-3 w-3" />;
              })()
            )}
          </div>
        </div>
      )}

      {/* Chain Health Indicator - compact */}
      {showChainHealth && chainHealth.length > 0 && (
        <div className="flex items-center gap-1">
          <Activity className="h-3.5 w-3.5 text-text-muted" />
          <div className="flex items-center gap-0.5">
            {chainHealth.slice(0, 3).map((chain) => {
              const config = healthConfig[chain.status];
              const Icon = config.icon;
              return (
                <div
                  key={chain.chain}
                  className={cn(
                    "flex items-center justify-center rounded-full p-0.5",
                    config.bg,
                    config.color
                  )}
                  title={`${chain.chain}: ${config.label}`}
                >
                  <Icon className="h-2.5 w-2.5" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Refresh button - only visible on hover */}
      <button
        onClick={() => refresh()}
        className="opacity-0 transition-opacity hover:opacity-100 focus:opacity-100"
        aria-label="Refresh health status"
        title="Refresh health status"
      >
        <RefreshCw className="h-3.5 w-3.5 text-text-muted hover:text-text-primary" />
      </button>
    </div>
  );
}
