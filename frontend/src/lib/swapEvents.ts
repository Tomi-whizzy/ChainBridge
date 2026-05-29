/**
 * Swap event abstraction.
 *
 * Provides a single, typed integration point for "swap update" notifications
 * so call sites do not need to know whether the underlying transport is a
 * websocket or a polling loop. Default behaviour is polling. The websocket
 * transport is gated behind the NEXT_PUBLIC_FEATURE_SWAP_WS_ENABLED feature
 * flag (see lib/config.ts) and remains a placeholder until the backend
 * pushes real-time swap events.
 */

export type SwapEventType =
  | "swap.created"
  | "swap.status_changed"
  | "swap.locked_initiator"
  | "swap.locked_responder"
  | "swap.completed"
  | "swap.refunded"
  | "swap.expired";

export interface SwapEvent<T = unknown> {
  type: SwapEventType;
  swapId: string;
  timestamp: string;
  data?: T;
}

export type SwapEventListener = (event: SwapEvent) => void;

export interface SwapEventTransport {
  /** Identifier shown in dev tools / logs. */
  readonly name: "polling" | "websocket";
  /** Subscribe to a stream of swap events. Returns an unsubscribe fn. */
  subscribe(listener: SwapEventListener): () => void;
}

export interface SwapEventOptions {
  /**
   * If true, prefer the websocket transport when the feature flag is on and
   * the runtime supports it. Falls back to polling otherwise.
   */
  preferWebsocket?: boolean;
  /** Polling interval in ms (default 15s). */
  pollIntervalMs?: number;
  /**
   * Function that fetches the latest events to feed into the polling
   * transport. Required when polling is used.
   */
  fetchEvents?: () => Promise<SwapEvent[]>;
}

const DEFAULT_POLL_INTERVAL_MS = 15_000;

export function createPollingTransport(
  fetchEvents: () => Promise<SwapEvent[]>,
  intervalMs: number = DEFAULT_POLL_INTERVAL_MS
): SwapEventTransport {
  return {
    name: "polling",
    subscribe(listener) {
      let cancelled = false;
      const tick = async () => {
        if (cancelled) return;
        try {
          const events = await fetchEvents();
          if (cancelled) return;
          for (const event of events) {
            listener(event);
          }
        } catch {
          // Swallow polling errors; a future event will drive recovery.
        }
      };

      void tick();
      const handle = setInterval(tick, intervalMs);

      return () => {
        cancelled = true;
        clearInterval(handle);
      };
    },
  };
}

/**
 * Placeholder websocket transport. The real implementation will wire into
 * the existing `useWebSocket` hook once the backend exposes the
 * `swap_events` channel. Until then this transport is a no-op so that
 * enabling the feature flag is safe.
 */
export function createWebsocketTransportPlaceholder(): SwapEventTransport {
  return {
    name: "websocket",
    subscribe() {
      return () => {};
    },
  };
}

export interface ResolveTransportArgs {
  websocketEnabled: boolean;
  options: SwapEventOptions;
}

export function resolveSwapEventTransport({
  websocketEnabled,
  options,
}: ResolveTransportArgs): SwapEventTransport {
  if (websocketEnabled && options.preferWebsocket) {
    return createWebsocketTransportPlaceholder();
  }

  if (!options.fetchEvents) {
    throw new Error(
      "resolveSwapEventTransport: fetchEvents is required when polling is the active transport"
    );
  }

  return createPollingTransport(options.fetchEvents, options.pollIntervalMs);
}
