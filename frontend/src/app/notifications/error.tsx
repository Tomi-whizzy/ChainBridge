"use client";

import { RouteErrorBoundary } from "@/components/layout/RouteErrorBoundary";

export default function NotificationsRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorBoundary routeName="Notifications" error={error} reset={reset} />;
}
