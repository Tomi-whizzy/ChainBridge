"use client";

import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export default function AdminRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorBoundary routeName="Admin" error={error} reset={reset} />;
}
