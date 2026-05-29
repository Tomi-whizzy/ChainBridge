"use client";

import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export default function SettingsRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorBoundary routeName="Settings" error={error} reset={reset} />;
}
