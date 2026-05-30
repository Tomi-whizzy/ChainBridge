"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useSettingsStore } from "@/hooks/useSettings";

/**
 * Renders once in the app shell when the active network is not mainnet.
 * Dismissible per session. Does not duplicate the network indicator in the Navbar.
 */
export function NetworkBanner() {
  const [dismissed, setDismissed] = useState(false);
  const networkMode = useSettingsStore((s) => s.settings.network.mode);

  if (dismissed || networkMode === "mainnet") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-16 z-30 flex items-center justify-between border-b border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm"
    >
      <span className="text-yellow-800 dark:text-yellow-300">
        You are on <strong>{networkMode}</strong>. Transactions here are not real — switch to
        mainnet for live swaps.
      </span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss network banner"
        className="ml-4 rounded p-0.5 text-yellow-800 transition hover:bg-yellow-500/20 dark:text-yellow-300"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
