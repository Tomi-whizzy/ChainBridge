"use client";

import { Suspense, useEffect } from "react";
import dynamic from "next/dynamic";
import { useTransactionStore } from "@/hooks/useTransactions";
import { TransactionFeedSkeleton } from "@/components/transactions/TransactionFeedSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";

const TransactionFeed = dynamic(
  () => import("@/components/transactions/TransactionFeed").then((m) => m.TransactionFeed),
  { loading: () => <TransactionFeedSkeleton rows={5} />, ssr: false }
);
import { Transaction, TransactionStatus } from "@/types";
import { ShieldCheck, Zap } from "lucide-react";

import { Badge } from "@/components/ui";
import { buildCompletedLifecycle, buildTransactionLifecycle } from "@/lib/transactionLifecycle";
import { getExplorerUrl } from "@/lib/explorers";

export default function TransactionsPage() {
  const transactions = useTransactionStore((state) => state.transactions);
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const breadcrumbs = useBreadcrumbs();

  // Seed mock data on mount ONLY if empty
  useEffect(() => {
    if (transactions.length === 0) {
      const mocks: Transaction[] = [
        {
          id: "tx_001",
          hash: "GCZXPLBZDMTFSLOMNC4P4TSRFXXSNQIHLXEMMJMA5FXVVSQ3UFPPJAE",
          chain: "Stellar",
          type: "swap_lock",
          amount: "1,250",
          token: "XLM",
          status: TransactionStatus.COMPLETED,
          confirmations: 1,
          requiredConfirmations: 1,
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          proofVerified: true,
          explorerUrl: getExplorerUrl("stellar", "GCZXPLBZDMTFSLOMNC4P4TSRFXXSNQIHLXEMMJMA5FXVVSQ3UFPPJAE"),
          lifecycle: buildCompletedLifecycle("Stellar"),
        },
        {
          id: "tx_002",
          hash: "0x7a8c3f9e2b5d1a6c4e9f2b7d8a3c5e9f2b7d8a3c5e9f2b7d8a3c5e9f2b7d8a3c",
          chain: "Ethereum",
          type: "swap_redeem",
          amount: "0.45",
          token: "ETH",
          status: TransactionStatus.CONFIRMING,
          confirmations: 6,
          requiredConfirmations: 12,
          timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
          proofVerified: false,
          explorerUrl: getExplorerUrl("ethereum", "0x7a8c3f9e2b5d1a6c4e9f2b7d8a3c5e9f2b7d8a3c5e9f2b7d8a3c5e9f2b7d8a3c"),
          lifecycle: buildTransactionLifecycle("Ethereum", "confirm"),
        },
        {
          id: "tx_003",
          hash: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          chain: "Bitcoin",
          type: "inbound",
          amount: "0.0024",
          token: "BTC",
          status: TransactionStatus.FAILED,
          confirmations: 0,
          requiredConfirmations: 3,
          timestamp: new Date().toISOString(),
          explorerUrl: getExplorerUrl("bitcoin", "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"),
          lifecycle: buildTransactionLifecycle("Bitcoin", "approval", {
            failedStep: "broadcast",
            errorMessage: "Bitcoin broadcast failed: mempool rejected the transaction fee rate.",
            retryable: true,
          }),
          failureReason: "Bitcoin broadcast failed: mempool rejected the transaction fee rate.",
        },
      ];
      mocks.forEach((t) => addTransaction(t));
    }
  }, [addTransaction, transactions.length]);

  return (
    <>
      <PageHeader
        title="Transaction Explorer"
        subtitle="Real-time monitoring of your cross-chain atomic swaps and native asset transfers. All proofs are verified against chain state."
        breadcrumbs={breadcrumbs}
        secondaryActions={[
          <StatCard key="total-swaps"
            label="Total Swaps"
            value={transactions.length.toString()}
            icon={<Zap className="h-4 w-4 text-brand-500" />}
          />,
          <StatCard key="verified-proofs"
            label="Verified Proofs"
            value={transactions.filter((t) => t.proofVerified).length.toString()}
            icon={<ShieldCheck className="h-4 w-4 text-emerald-500" />}
          />,
        ]}
      />
      <div className="container mx-auto max-w-6xl px-4 py-12 md:py-20 animate-fade-in">
        <Suspense fallback={<TransactionFeedSkeleton rows={5} />}>
          <TransactionFeed transactions={transactions} />
        </Suspense>
      </div>
    </>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-surface-overlay/50 border border-border p-4 min-w-[140px]">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-black text-text-primary">{value}</div>
    </div>
  );
}
