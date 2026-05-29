import { cn, CHAIN_BG } from "@/lib/utils";
import { HTMLAttributes } from "react";
import type { SwapStatus } from "@/types";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "chain";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  chain?: string;
  status?: SwapStatus;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-status-warning/15 text-status-warning border-status-warning/25",
  locked_initiator: "bg-status-info/15 text-status-info border-status-info/25",
  locked_responder: "bg-accent/15 text-accent border-accent/25",
  completed: "bg-status-success/15 text-status-success border-status-success/25",
  cancelled: "bg-status-error/15 text-status-error border-status-error/25",
  expired: "bg-text-muted/25 text-text-primary border-text-muted/35",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  locked_initiator: "Locked (Init)",
  locked_responder: "Locked (Resp)",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
};

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-overlay text-text-primary border-border",
  success: "bg-status-success/15 text-status-success border-status-success/25",
  warning: "bg-status-warning/15 text-status-warning border-status-warning/25",
  error: "bg-status-error/15 text-status-error border-status-error/25",
  info: "bg-status-info/15 text-status-info border-status-info/25",
  chain: "",
};

export function Badge({
  variant = "default",
  chain,
  status,
  className,
  children,
  ...props
}: BadgeProps) {
  const chainStyle = chain ? (CHAIN_BG[chain.toLowerCase()] ?? "") : "";
  const statusStyle = status ? (STATUS_STYLES[status] ?? "") : "";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variant === "chain" ? chainStyle : variantStyles[variant],
        status && statusStyle,
        className
      )}
      {...props}
    >
      {status ? STATUS_LABELS[status] : children}
    </span>
  );
}
