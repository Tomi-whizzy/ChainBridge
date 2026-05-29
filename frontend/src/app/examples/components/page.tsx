"use client";

import { useState } from "react";
import {
  StatusBadge,
  StatusPill,
  StatusDot,
  ChainAssetSelector,
  type Asset,
  type Chain,
} from "@/components/ui";
import {
  PortfolioChainCard,
  PortfolioChainGrid,
  type PortfolioChainData,
} from "@/components/dashboard";
import { MultiStepFormGuard, StepIndicator } from "@/components/forms";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Mock data
const mockChains: Chain[] = [
  {
    id: "stellar",
    name: "Stellar",
    assets: [
      { symbol: "XLM", name: "Stellar Lumens", chain: "stellar", balance: "1,234.56" },
      { symbol: "USDC", name: "USD Coin", chain: "stellar", balance: "500.00" },
    ],
  },
  {
    id: "ethereum",
    name: "Ethereum",
    assets: [
      { symbol: "ETH", name: "Ethereum", chain: "ethereum", balance: "2.5" },
      { symbol: "USDT", name: "Tether", chain: "ethereum", balance: "1,000.00" },
    ],
  },
  {
    id: "bitcoin",
    name: "Bitcoin",
    assets: [{ symbol: "BTC", name: "Bitcoin", chain: "bitcoin", balance: "0.125" }],
  },
  {
    id: "solana",
    name: "Solana",
    assets: [
      { symbol: "SOL", name: "Solana", chain: "solana", balance: "45.8" },
      { symbol: "USDC", name: "USD Coin", chain: "solana", balance: "250.00" },
    ],
  },
];

const mockPortfolioData: PortfolioChainData[] = [
  {
    chain: "stellar",
    chainName: "Stellar",
    status: "operational",
    totalValueUsd: 1234.56,
    change24h: 5.23,
    assets: [
      { symbol: "XLM", name: "Stellar Lumens", balance: "1,234.56", valueUsd: 987.65 },
      { symbol: "USDC", name: "USD Coin", balance: "500.00", valueUsd: 500.0 },
    ],
    activeSwaps: 2,
    pendingTransactions: 1,
  },
  {
    chain: "ethereum",
    chainName: "Ethereum",
    status: "operational",
    totalValueUsd: 5678.9,
    change24h: -2.15,
    assets: [
      { symbol: "ETH", name: "Ethereum", balance: "2.5", valueUsd: 5178.9 },
      { symbol: "USDT", name: "Tether", balance: "1,000.00", valueUsd: 1000.0 },
    ],
    activeSwaps: 0,
    pendingTransactions: 0,
  },
  {
    chain: "bitcoin",
    chainName: "Bitcoin",
    status: "degraded",
    totalValueUsd: 8765.43,
    change24h: 1.87,
    assets: [{ symbol: "BTC", name: "Bitcoin", balance: "0.125", valueUsd: 8765.43 }],
    activeSwaps: 1,
  },
  {
    chain: "solana",
    chainName: "Solana",
    status: "operational",
    totalValueUsd: 1543.21,
    change24h: 8.92,
    assets: [
      { symbol: "SOL", name: "Solana", balance: "45.8", valueUsd: 1293.21 },
      { symbol: "USDC", name: "USD Coin", balance: "250.00", valueUsd: 250.0 },
    ],
  },
];

export default function ComponentExamplesPage() {
  const [selectedChain, setSelectedChain] = useState<string>();
  const [selectedAsset, setSelectedAsset] = useState<string>();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleAssetSelect = (chain: string, asset: string) => {
    setSelectedChain(chain);
    setSelectedAsset(asset);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSaveForm = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setHasUnsavedChanges(false);
  };

  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="mx-auto max-w-7xl space-y-12">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-text-primary">Component Examples</h1>
          <p className="text-text-muted">
            Showcase of the new components: Status Badges, Chain/Asset Selector, Portfolio Cards,
            and Form Guards
          </p>
        </div>

        {/* Status Badges Section */}
        <section className="space-y-6">
          <div>
            <h2 className="mb-4 text-2xl font-semibold text-text-primary">Status Badges & Pills</h2>
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-text-primary">Status Badges</h3>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="mb-3 text-sm text-text-muted">Small Size</p>
                  <div className="flex flex-wrap gap-3">
                    <StatusBadge variant="success" label="Success" size="sm" />
                    <StatusBadge variant="pending" label="Pending" size="sm" />
                    <StatusBadge variant="error" label="Error" size="sm" />
                    <StatusBadge variant="warning" label="Warning" size="sm" />
                    <StatusBadge variant="info" label="Info" size="sm" />
                    <StatusBadge variant="processing" label="Processing" size="sm" />
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm text-text-muted">Medium Size (Default)</p>
                  <div className="flex flex-wrap gap-3">
                    <StatusBadge variant="success" label="Completed" />
                    <StatusBadge variant="pending" label="Pending" pulse />
                    <StatusBadge variant="error" label="Failed" />
                    <StatusBadge variant="warning" label="Warning" />
                    <StatusBadge variant="processing" label="Processing" />
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm text-text-muted">Status Pills with Descriptions</p>
                  <div className="flex flex-wrap gap-3">
                    <StatusPill
                      variant="success"
                      label="Transaction Complete"
                      description="Confirmed on chain"
                    />
                    <StatusPill
                      variant="pending"
                      label="Awaiting Confirmation"
                      description="2 of 6 confirmations"
                      pulse
                    />
                    <StatusPill
                      variant="processing"
                      label="Syncing"
                      description="Block 1,234,567"
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm text-text-muted">Status Dots</p>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <StatusDot variant="success" />
                      <span className="text-sm text-text-secondary">Operational</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusDot variant="warning" pulse />
                      <span className="text-sm text-text-secondary">Degraded</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusDot variant="error" />
                      <span className="text-sm text-text-secondary">Down</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Chain Asset Selector Section */}
        <section className="space-y-6">
          <div>
            <h2 className="mb-4 text-2xl font-semibold text-text-primary">
              Chain & Asset Selector
            </h2>
            <Card>
              <CardContent className="space-y-4 pt-6">
                <ChainAssetSelector
                  chains={mockChains}
                  selectedChain={selectedChain}
                  selectedAsset={selectedAsset}
                  onSelect={handleAssetSelect}
                  label="Select Asset"
                  showBalance
                />
                {selectedChain && selectedAsset && (
                  <div className="rounded-lg bg-surface-overlay p-4">
                    <p className="text-sm text-text-muted">Selected:</p>
                    <p className="text-lg font-medium text-text-primary">
                      {selectedAsset} on {selectedChain}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Portfolio Chain Cards Section */}
        <section className="space-y-6">
          <div>
            <h2 className="mb-4 text-2xl font-semibold text-text-primary">Portfolio Chain Cards</h2>
            <PortfolioChainGrid
              chains={mockPortfolioData}
              onChainClick={(chain) => alert(`Clicked ${chain}`)}
            />
          </div>
        </section>

        {/* Multi-Step Form Guard Section */}
        <section className="space-y-6">
          <div>
            <h2 className="mb-4 text-2xl font-semibold text-text-primary">
              Multi-Step Form with Unsaved Changes Guard
            </h2>
            <Card>
              <CardContent className="space-y-6 pt-6">
                <StepIndicator
                  currentStep={currentStep}
                  totalSteps={3}
                  steps={["Details", "Review", "Confirm"]}
                />

                <MultiStepFormGuard
                  currentStep={currentStep}
                  totalSteps={3}
                  hasUnsavedChanges={hasUnsavedChanges}
                  onSave={handleSaveForm}
                  onDiscard={() => {
                    setFormData({ name: "", email: "" });
                    setHasUnsavedChanges(false);
                  }}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-text-primary">
                        Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleFormChange("name", e.target.value)}
                        className="w-full rounded-xl border border-border bg-surface px-4 py-2 text-text-primary focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-text-primary">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleFormChange("email", e.target.value)}
                        className="w-full rounded-xl border border-border bg-surface px-4 py-2 text-text-primary focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        placeholder="Enter your email"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                        disabled={currentStep === 1}
                        className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-overlay disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                        disabled={currentStep === 3}
                        className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </MultiStepFormGuard>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
