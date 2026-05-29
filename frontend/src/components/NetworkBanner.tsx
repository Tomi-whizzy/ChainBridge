import React, { useState } from "react";

const supportedChains = ["mainnet", "testnet", "devnet"];

export function NetworkBanner({ network }: { network: string }) {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;
  if (!supportedChains.includes(network)) {
    return <div>Unsupported network</div>;
  }
  if (network === "mainnet") return null;

  return (
    <div className="bg-yellow-500 text-black p-2 flex items-center justify-between">
      <span>You are on {network}. Switch to mainnet for real swaps.</span>
      <button className="ml-4 underline" onClick={() => setHidden(true)}>
        Dismiss
      </button>
    </div>
  );
}
