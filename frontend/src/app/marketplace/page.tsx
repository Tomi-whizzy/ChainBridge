"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OrderBookList } from "@/components/marketplace/OrderBookList";
import { OrderTakeModal } from "@/components/marketplace/OrderTakeModal";
import { DepthChart } from "@/components/marketplace/DepthChart";
import { useOrderBookStore, useMockOrders } from "@/hooks/useOrderBook";
import { useTransactionStore } from "@/hooks/useTransactions";
import { Order, OrderStatus, TransactionStatus } from "@/types";
import { Button } from "@/components/ui";
import { TrendingUp, Info, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  buildCompletedLifecycle,
  buildTransactionLifecycle,
  sleep,
} from "@/lib/transactionLifecycle";
import { getExplorerUrl } from "@/lib/explorers";
import { useUnifiedWallet } from "@/components/wallet/UnifiedWalletProvider";

function fundingChainForOrder(order: Order) {
  return order.side === "buy" ? order.chainOut : order.chainIn;
}

function fundingAmountForOrder(order: Order) {
  return order.side === "buy" ? order.total : order.amount;
}

function fundingTokenForOrder(order: Order) {
  return order.side === "buy" ? order.tokenOut : order.tokenIn;
}

export default function MarketplacePage() {
  const { orders, updateOrder } = useOrderBookStore();
  const { seedMockOrders } = useMockOrders();
  const { activeAddress: address } = useUnifiedWallet();
  const transactions = useTransactionStore((state) => state.transactions);
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const updateTransaction = useTransactionStore((state) => state.updateTransaction);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workflowTxId, setWorkflowTxId] = useState<string | null>(null);

  useEffect(() => {
    seedMockOrders(address ?? undefined);
  }, [address, seedMockOrders]);

  const handleTakeOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const workflowTx = transactions.find((transaction) => transaction.id === workflowTxId) ?? null;

  const confirmTakeOrder = async (order: Order) => {
    const chain = fundingChainForOrder(order);
    const txId = `match-${order.id}`;
    const hash = `0x${Date.now().toString(16)}${order.id.slice(-4)}`;

    setWorkflowTxId(txId);

    addTransaction({
      id: txId,
      hash: "pending",
      chain,
      type: "swap_lock",
      amount: fundingAmountForOrder(order),
      token: fundingTokenForOrder(order),
      status: TransactionStatus.PENDING,
      confirmations: 0,
      requiredConfirmations: 1,
      timestamp: new Date().toISOString(),
      counterparty: order.maker,
      explorerUrl: getExplorerUrl(chain, hash),
      lifecycle: buildTransactionLifecycle(chain, "approval"),
    });

    await sleep(600);
    updateTransaction(txId, {
      lifecycle: buildTransactionLifecycle(chain, "sign"),
    });

    await sleep(800);
    updateTransaction(txId, {
      hash,
      status: TransactionStatus.CONFIRMING,
      lifecycle: buildTransactionLifecycle(chain, "broadcast"),
    });

    await sleep(900);
    updateTransaction(txId, {
      status: TransactionStatus.CONFIRMING,
      lifecycle: buildTransactionLifecycle(chain, "confirm"),
    });

    await sleep(1100);
    updateTransaction(txId, {
      status: TransactionStatus.COMPLETED,
      confirmations: 1,
      proofVerified: true,
      lifecycle: buildCompletedLifecycle(chain),
    });
    updateOrder(order.id, { status: OrderStatus.FILLED });
  };

  const closeDrawer = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
    setWorkflowTxId(null);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Order Book"
        subtitle="Browse active cross-chain swap offers or create your own. All trades are protected by trustless hash-timelock contracts."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Marketplace", isCurrent: true },
        ]}
        primaryAction={
          <Button variant="primary" className="h-10 px-5 shadow-glow-sm" icon={<Plus size={16} />}>
            Create Order
          </Button>
        }
        secondaryActions={[
          <Link key="my-orders" href="/orders">
            <Button variant="secondary" className="h-10 px-5">My Orders</Button>
          </Link>,
        ]}
      />

      <div className="pt-8 grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-8">
          <OrderBookList orders={orders} onTakeOrder={handleTakeOrder} />
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface-overlay/30 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
                Market Liquidity
              </h3>
              <TrendingUp size={16} className="text-brand-500" />
            </div>
            <DepthChart orders={orders} />
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase">24h Vol</p>
                <p className="text-lg font-black text-text-primary">$1.2M</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase">Active</p>
                <p className="text-lg font-black text-text-primary">
                  {orders.filter((o) => o.status === OrderStatus.OPEN).length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-brand-500/5 p-6 border-dashed">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
                <Info size={20} />
              </div>
              <div>
                <h4 className="font-bold text-text-primary">How it works</h4>
                <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                  Taking an order creates an atomic swap. You'll lock funds on the source chain
                  first, then the maker will lock on the destination.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 px-0 text-brand-500 hover:bg-transparent h-auto"
                >
                  Learn more about HTLCs →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <OrderTakeModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={closeDrawer}
        onConfirm={confirmTakeOrder}
        workflowTx={workflowTx}
      />
    </div>
  );
}
