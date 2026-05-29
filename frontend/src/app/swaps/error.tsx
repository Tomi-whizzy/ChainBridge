"use client";

import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export default function SwapsRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorBoundary routeName="Swaps" error={error} reset={reset} />;
}
