import {
  ApiClientError,
  DEFAULT_API_RETRY_CONFIG,
  DEFAULT_API_TIMEOUT_MS,
  createApiClient,
  normalizeApiError,
} from "@/lib/api/client";

describe("createApiClient", () => {
  it("uses the default timeout when none is provided", () => {
    const client = createApiClient({ basePath: "/x" });
    expect(client.instance.defaults.timeout).toBe(DEFAULT_API_TIMEOUT_MS);
  });

  it("respects an explicit timeoutMs", () => {
    const client = createApiClient({ basePath: "/x", timeoutMs: 1234 });
    expect(client.instance.defaults.timeout).toBe(1234);
  });

  it("merges retry overrides with defaults", () => {
    const client = createApiClient({
      basePath: "/x",
      retry: { maxRetries: 5 },
    });
    expect(client.retryConfig).toEqual({
      ...DEFAULT_API_RETRY_CONFIG,
      maxRetries: 5,
    });
  });
});

describe("normalizeApiError", () => {
  it("returns the same instance when given an ApiClientError", () => {
    const original = new ApiClientError({
      message: "boom",
      status: 418,
      code: "TEAPOT",
    });
    expect(normalizeApiError(original)).toBe(original);
  });

  it("wraps generic Error with UNKNOWN_ERROR code", () => {
    const wrapped = normalizeApiError(new Error("oops"));
    expect(wrapped).toBeInstanceOf(ApiClientError);
    expect(wrapped.code).toBe("UNKNOWN_ERROR");
    expect(wrapped.status).toBe(500);
    expect(wrapped.message).toBe("oops");
  });

  it("wraps unknown values with UNKNOWN_ERROR code", () => {
    const wrapped = normalizeApiError("string error");
    expect(wrapped.code).toBe("UNKNOWN_ERROR");
    expect(wrapped.status).toBe(500);
    expect(wrapped.details).toBe("string error");
  });
});
