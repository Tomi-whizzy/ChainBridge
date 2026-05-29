"use client";

import {
  PortfolioChainCard,
  type PortfolioChainData,
} from "@/components/dashboard/PortfolioChainCard";

/**
 * Issue #405 — neutral demo / empty portfolio data for the three
 * cross-chain bridges ChainBridge supports. Used as the dashboard fallback
 * until real balance data is wired into the wallet provider. Each card
 * shows zeroed values so the layout still reads as "no holdings here yet"
 * rather than a fake portfolio.
 */
const DEMO_PORTFOLIO: PortfolioChainData[] = [
  {
    chain: "stellar",
    chainName: "Stellar",
    status: "operational",
    totalValueUsd: 0,
    assets: [],
    activeSwaps: 0,
    pendingTransactions: 0,
  },
  {
    chain: "bitcoin",
    chainName: "Bitcoin",
    status: "operational",
    totalValueUsd: 0,
    assets: [],
    activeSwaps: 0,
    pendingTransactions: 0,
  },
  {
    chain: "ethereum",
    chainName: "Ethereum",
    status: "operational",
    totalValueUsd: 0,
    assets: [],
    activeSwaps: 0,
    pendingTransactions: 0,
  },
];

/**
 * Issue #405 — dashboard portfolio-by-chain section.
 *
 * Renders a `PortfolioChainCard` per supported chain (Stellar, Bitcoin,
 * Ethereum). Grid stacks to one column on mobile (per the issue's
 * acceptance criteria) and expands to three columns on `lg`. The
 * `PortfolioChainCard` component already exists in the repo; this just
 * wires it into the dashboard with neutral demo data until real balances
 * are available from the wallet provider.
 */
export function PortfolioChainsSection() {
  return (
    <section
      aria-labelledby="dashboard-portfolio-chains"
      className="space-y-4"
    >
      <header>
        <h2
          id="dashboard-portfolio-chains"
          className="text-xl font-semibold text-text-primary"
        >
          Portfolio by Chain
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Balances across the chains ChainBridge bridges.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {DEMO_PORTFOLIO.map((data) => (
          <PortfolioChainCard key={data.chain} data={data} />
        ))}
      </div>
    </section>
  );
}
