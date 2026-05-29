"use client";

import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export default function TransactionsRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorBoundary routeName="Transactions" error={error} reset={reset} />;
}
