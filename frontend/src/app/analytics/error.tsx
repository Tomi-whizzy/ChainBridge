"use client";

import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export default function AnalyticsRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorBoundary routeName="Analytics" error={error} reset={reset} />;
}
