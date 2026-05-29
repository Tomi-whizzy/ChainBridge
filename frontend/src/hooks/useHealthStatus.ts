import { useState, useEffect } from "react";

export type HealthStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

export interface ServiceHealth {
  name: string;
  status: HealthStatus;
  latency?: number;
  lastChecked: Date;
}

export interface HealthIndicator {
  chain: string;
  status: HealthStatus;
  isRunning: boolean;
  blocksBehind?: number;
  lastUpdated: Date;
}

const CACHE_DURATION = 60000; // 1 minute cache
const FETCH_INTERVAL = 30000; // Refresh every 30 seconds

export function useHealthStatus() {
  const [chainHealth, setChainHealth] = useState<HealthIndicator[]>([]);
  const [apiHealth, setApiHealth] = useState<ServiceHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  // Simulate chain health fetch (in production, this would call the actual API)
  const fetchChainHealth = async () => {
    try {
      // In production, replace with actual API call
      // const response = await fetchChainHealth();
      // For now, return mock data with neutral fallback
      const mockChains: HealthIndicator[] = [
        {
          chain: "stellar",
          status: "healthy",
          isRunning: true,
          blocksBehind: 0,
          lastUpdated: new Date(),
        },
        {
          chain: "ethereum",
          status: "healthy",
          isRunning: true,
          blocksBehind: 2,
          lastUpdated: new Date(),
        },
        {
          chain: "bitcoin",
          status: "degraded",
          isRunning: true,
          blocksBehind: 15,
          lastUpdated: new Date(),
        },
      ];
      setChainHealth(mockChains);
    } catch (error) {
      // Neutral fallback - don't interrupt workflow
      console.error("Failed to fetch chain health:", error);
      setChainHealth([]);
    }
  };

  // Simulate API health fetch
  const fetchApiHealth = async () => {
    try {
      const start = performance.now();
      // In production, replace with actual API health check
      // const response = await fetch(`${config.api.url}/health`);
      await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate network delay
      const latency = performance.now() - start;

      setApiHealth({
        name: "Backend API",
        status: latency < 500 ? "healthy" : latency < 1000 ? "degraded" : "unhealthy",
        latency: Math.round(latency),
        lastChecked: new Date(),
      });
    } catch (error) {
      // Neutral fallback - don't interrupt workflow
      console.error("Failed to fetch API health:", error);
      setApiHealth({
        name: "Backend API",
        status: "unknown",
        lastChecked: new Date(),
      });
    }
  };

  const fetchAllHealth = async () => {
    const now = new Date();
    if (lastFetch && now.getTime() - lastFetch.getTime() < CACHE_DURATION) {
      return; // Use cached data
    }

    setIsLoading(true);
    await Promise.all([fetchChainHealth(), fetchApiHealth()]);
    setLastFetch(now);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAllHealth();

    // Set up periodic refresh
    const interval = setInterval(fetchAllHealth, FETCH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return {
    chainHealth,
    apiHealth,
    isLoading,
    lastFetch,
    refresh: fetchAllHealth,
  };
}
