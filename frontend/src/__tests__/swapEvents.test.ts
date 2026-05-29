import {
  createPollingTransport,
  createWebsocketTransportPlaceholder,
  resolveSwapEventTransport,
  type SwapEvent,
} from "@/lib/swapEvents";

describe("createPollingTransport", () => {
  it("delivers fetched events to the listener", async () => {
    jest.useFakeTimers();
    const event: SwapEvent = {
      type: "swap.status_changed",
      swapId: "abc",
      timestamp: "2026-01-01T00:00:00Z",
    };
    const fetchEvents = jest.fn().mockResolvedValue([event]);
    const transport = createPollingTransport(fetchEvents, 1_000);
    const listener = jest.fn();

    const unsubscribe = transport.subscribe(listener);

    await Promise.resolve();
    await Promise.resolve();
    expect(fetchEvents).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(event);

    unsubscribe();
    jest.advanceTimersByTime(5_000);
    expect(fetchEvents).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it("swallows fetch errors so polling stays alive", async () => {
    jest.useFakeTimers();
    const fetchEvents = jest.fn().mockRejectedValue(new Error("network down"));
    const transport = createPollingTransport(fetchEvents, 1_000);
    const listener = jest.fn();
    const unsubscribe = transport.subscribe(listener);

    await Promise.resolve();
    await Promise.resolve();
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
    jest.useRealTimers();
  });
});

describe("createWebsocketTransportPlaceholder", () => {
  it("is a no-op until the backend exposes events", () => {
    const transport = createWebsocketTransportPlaceholder();
    expect(transport.name).toBe("websocket");
    const listener = jest.fn();
    const unsubscribe = transport.subscribe(listener);
    expect(typeof unsubscribe).toBe("function");
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });
});

describe("resolveSwapEventTransport", () => {
  it("returns polling by default", () => {
    const transport = resolveSwapEventTransport({
      websocketEnabled: false,
      options: { fetchEvents: async () => [] },
    });
    expect(transport.name).toBe("polling");
  });

  it("returns polling when feature flag is on but preferWebsocket is false", () => {
    const transport = resolveSwapEventTransport({
      websocketEnabled: true,
      options: { fetchEvents: async () => [], preferWebsocket: false },
    });
    expect(transport.name).toBe("polling");
  });

  it("returns websocket when feature flag is on and preferWebsocket is true", () => {
    const transport = resolveSwapEventTransport({
      websocketEnabled: true,
      options: { preferWebsocket: true, fetchEvents: async () => [] },
    });
    expect(transport.name).toBe("websocket");
  });

  it("throws when polling is active but no fetchEvents provided", () => {
    expect(() =>
      resolveSwapEventTransport({
        websocketEnabled: false,
        options: {},
      })
    ).toThrow(/fetchEvents is required/);
  });
});
