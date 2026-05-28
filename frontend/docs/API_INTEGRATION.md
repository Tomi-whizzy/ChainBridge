# API Integration Guide

This document describes the frontend API integration layer, including endpoint wrappers, error handling, and retry strategies.

## Overview

The frontend communicates with the ChainBridge backend API through a typed client layer built on Axios. All API interactions are centralized in `src/lib/api/`, providing:

- Type-safe request/response handling with Zod validation
- Normalized error handling
- Configurable retry logic
- Authentication via API keys

## Architecture

```
src/lib/api/
├── client.ts          # Core API client factory and error normalization
├── validation.ts      # Zod-based response validation
├── schemas.ts         # Zod schemas for API responses
├── orders.ts          # Orders endpoint wrapper
├── swaps.ts           # Swaps endpoint wrapper
├── htlcs.ts           # HTLCs endpoint wrapper
└── index.ts           # Public exports
```

## Endpoint Groups

### Orders API (`/api/v1/orders`)

Manages order creation, matching, and cancellation.

| Function                       | Method | Endpoint           | Description                       |
| ------------------------------ | ------ | ------------------ | --------------------------------- |
| `listOrders(params)`           | GET    | `/`                | List orders with optional filters |
| `getOrder(orderId)`            | GET    | `/:orderId`        | Get single order by ID            |
| `createOrder(payload)`         | POST   | `/`                | Create new order                  |
| `matchOrder(orderId, payload)` | POST   | `/:orderId/match`  | Match an existing order           |
| `cancelOrder(orderId)`         | POST   | `/:orderId/cancel` | Cancel an order                   |

**Example:**

```typescript
import { listOrders, createOrder } from "@/lib/api";

// List all open orders
const orders = await listOrders({ status: "open" });

// Create a new order
const newOrder = await createOrder({
  source_chain: "ethereum",
  target_chain: "bitcoin",
  source_amount: "1000000000000000000", // 1 ETH in wei
  target_amount: "100000000", // 1 BTC in satoshis
  source_address: "0x...",
  target_address: "bc1...",
  expiry: Math.floor(Date.now() / 1000) + 3600,
});
```

### Swaps API (`/api/v1/swaps`)

Tracks atomic swap execution and proof verification.

| Function                           | Method | Endpoint                | Description                      |
| ---------------------------------- | ------ | ----------------------- | -------------------------------- |
| `listSwaps(params)`                | GET    | `/`                     | List swaps with optional filters |
| `getSwap(swapId)`                  | GET    | `/:swapId`              | Get single swap by ID            |
| `verifySwapProof(swapId, payload)` | POST   | `/:swapId/verify-proof` | Submit proof for verification    |

**Example:**

```typescript
import { getSwap, verifySwapProof } from "@/lib/api";

// Get swap details
const swap = await getSwap("swap_123");

// Verify proof
const result = await verifySwapProof("swap_123", {
  proof: "0x...",
  chain: "ethereum",
});
```

### HTLCs API (`/api/v1/htlcs`)

Manages Hash Time-Locked Contracts for atomic swaps.

| Function                     | Method | Endpoint          | Description                      |
| ---------------------------- | ------ | ----------------- | -------------------------------- |
| `listHTLCs(params)`          | GET    | `/`               | List HTLCs with optional filters |
| `getHTLC(htlcId)`            | GET    | `/:htlcId`        | Get single HTLC by ID            |
| `getHTLCStatus(htlcId)`      | GET    | `/:htlcId/status` | Get HTLC status                  |
| `createHTLC(payload)`        | POST   | `/`               | Create new HTLC                  |
| `claimHTLC(htlcId, payload)` | POST   | `/:htlcId/claim`  | Claim HTLC with secret           |
| `refundHTLC(htlcId)`         | POST   | `/:htlcId/refund` | Refund expired HTLC              |

**Example:**

```typescript
import { createHTLC, claimHTLC } from "@/lib/api";

// Create HTLC
const htlc = await createHTLC({
  hash_lock: "0x...",
  time_lock: Math.floor(Date.now() / 1000) + 7200,
  sender: "0x...",
  receiver: "0x...",
  amount: "1000000000000000000",
  chain: "ethereum",
});

// Claim HTLC
const claimed = await claimHTLC(htlc.id, {
  secret: "0x...",
});
```

## Error Handling

### Error Normalization

All API errors are normalized to `ApiClientError` with a consistent shape:

```typescript
interface ApiClientError extends Error {
  status: number; // HTTP status code
  code: string; // Error code (e.g., 'ORDER_NOT_FOUND')
  message: string; // Human-readable message
  details?: unknown; // Additional error context
}
```

### Error Code Mapping

Backend error codes are mapped to user-friendly messages in the UI layer.

| Backend Code                | HTTP Status | User Message                                                 | Retry?            |
| --------------------------- | ----------- | ------------------------------------------------------------ | ----------------- |
| `ORDER_NOT_FOUND`           | 404         | "Order not found. It may have been cancelled or completed."  | No                |
| `ORDER_EXPIRED`             | 400         | "This order has expired. Please create a new one."           | No                |
| `INSUFFICIENT_BALANCE`      | 400         | "Insufficient balance to complete this order."               | No                |
| `INVALID_ADDRESS`           | 400         | "Invalid blockchain address. Please check and try again."    | No                |
| `HTLC_NOT_FOUND`            | 404         | "HTLC not found. It may have been claimed or refunded."      | No                |
| `HTLC_EXPIRED`              | 400         | "This HTLC has expired and can no longer be claimed."        | No                |
| `INVALID_SECRET`            | 400         | "Invalid secret provided. Please verify and try again."      | No                |
| `SWAP_NOT_FOUND`            | 404         | "Swap not found. Please check the swap ID."                  | No                |
| `PROOF_VERIFICATION_FAILED` | 400         | "Proof verification failed. Please check your transaction."  | No                |
| `RATE_LIMIT_EXCEEDED`       | 429         | "Too many requests. Please wait a moment and try again."     | Yes (after delay) |
| `NETWORK_ERROR`             | 500         | "Network error. Please check your connection and try again." | Yes               |
| `TIMEOUT`                   | 504         | "Request timed out. Please try again."                       | Yes               |
| `INTERNAL_SERVER_ERROR`     | 500         | "An unexpected error occurred. Please try again later."      | Yes               |
| `SERVICE_UNAVAILABLE`       | 503         | "Service temporarily unavailable. Please try again later."   | Yes               |

### Error Handling Example

```typescript
import { ApiClientError, normalizeApiError, getOrder } from "@/lib/api";

try {
  const order = await getOrder("order_123");
} catch (error) {
  const apiError = normalizeApiError(error);

  if (apiError.code === "ORDER_NOT_FOUND") {
    // Handle not found
    showToast("Order not found", "error");
  } else if (apiError.status === 429) {
    // Handle rate limit
    showToast("Too many requests. Please wait.", "warning");
  } else {
    // Generic error
    showToast(apiError.message, "error");
  }
}
```

## Retry Strategy

### Configuration

Retry behavior is configurable per client:

```typescript
interface ApiRetryConfig {
  maxRetries: number; // Maximum retry attempts
  initialDelayMs: number; // Initial delay before first retry
  maxDelayMs: number; // Maximum delay between retries
  backoffMultiplier: number; // Exponential backoff multiplier
}
```

### Default Configuration

```typescript
const DEFAULT_API_RETRY_CONFIG = {
  maxRetries: 0, // No retries by default
  initialDelayMs: 500, // 500ms initial delay
  maxDelayMs: 5_000, // 5s maximum delay
  backoffMultiplier: 2, // Exponential backoff (2x)
};
```

### Retry Logic

Retries are applied for:

- Network errors (no response received)
- Timeout errors (504)
- Server errors (500, 502, 503)
- Rate limit errors (429) - with exponential backoff

Retries are **NOT** applied for:

- Client errors (400-499, except 429)
- Validation errors
- Authentication errors (401, 403)

### Custom Retry Configuration

```typescript
import { createApiClient } from "@/lib/api";

const customClient = createApiClient({
  basePath: "/orders",
  retry: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10_000,
    backoffMultiplier: 2,
  },
});
```

### Retry with React Query

For UI components, use React Query's built-in retry mechanism:

```typescript
import { useQuery } from "@tanstack/react-query";
import { listOrders } from "@/lib/api";

function OrdersList() {
  const { data, error, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => listOrders(),
    retry: (failureCount, error) => {
      // Retry up to 3 times for server errors
      if (error instanceof ApiClientError && error.status >= 500) {
        return failureCount < 3;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // ...
}
```

## Authentication

### API Key Storage

API keys are stored in localStorage and automatically included in requests:

```typescript
// Store API key
localStorage.setItem("cb_api_key", "your-api-key");

// API key is automatically included in all requests
const orders = await listOrders(); // Includes X-API-Key header
```

### Header Injection

The `getUserApiHeaders()` function reads the API key and injects it:

```typescript
export function getUserApiHeaders(): Record<string, string> | undefined {
  const localKey = localStorage.getItem("cb_api_key");
  const envKey = process.env.NEXT_PUBLIC_CHAINBRIDGE_API_KEY;
  const apiKey = localKey || envKey;

  return apiKey ? { "X-API-Key": apiKey } : undefined;
}
```

## Response Validation

### Zod Schemas

All API responses are validated using Zod schemas to ensure type safety:

```typescript
import { z } from "zod";

export const ApiOrderRecordSchema = z.object({
  id: z.string(),
  source_chain: z.string(),
  target_chain: z.string(),
  source_amount: z.string(),
  target_amount: z.string(),
  status: z.enum(["open", "matched", "cancelled", "expired"]),
  created_at: z.string(),
  // ...
});
```

### Validation Errors

If validation fails, a `ValidationError` is thrown:

```typescript
try {
  const order = await getOrder("order_123");
} catch (error) {
  if (isValidationError(error)) {
    console.error("Invalid API response:", error.issues);
    // Fallback or report to error monitoring
  }
}
```

### Disabling Validation

For performance-critical paths or during development:

```typescript
const client = createApiClient({
  basePath: "/orders",
  enableValidation: false, // Skip Zod validation
});
```

## Timeouts

Default timeout is 30 seconds. Configure per client:

```typescript
const client = createApiClient({
  basePath: "/orders",
  timeoutMs: 60_000, // 60 seconds
});
```

## Best Practices

1. **Always handle errors**: Wrap API calls in try-catch blocks
2. **Use React Query**: Leverage caching and automatic retries
3. **Validate user input**: Check addresses and amounts before API calls
4. **Show loading states**: Provide feedback during API requests
5. **Log errors**: Send validation errors to monitoring (Sentry, etc.)
6. **Test error paths**: Simulate API failures in tests
7. **Use TypeScript**: Leverage type safety for payloads and responses

## Testing

### Mocking API Calls

```typescript
import { jest } from "@jest/globals";
import * as api from "@/lib/api";

jest.mock("@/lib/api", () => ({
  listOrders: jest.fn(),
}));

test("handles order list", async () => {
  (api.listOrders as jest.Mock).mockResolvedValue([{ id: "order_1", status: "open" }]);

  // Test component that uses listOrders
});
```

### Testing Error Handling

```typescript
import { ApiClientError } from "@/lib/api";

test("handles API errors", async () => {
  (api.getOrder as jest.Mock).mockRejectedValue(
    new ApiClientError({
      message: "Order not found",
      status: 404,
      code: "ORDER_NOT_FOUND",
    })
  );

  // Test error handling
});
```

## Related Documentation

- [Frontend Architecture](./ARCHITECTURE.md)
- [Error Handling](../../docs/ERROR_HANDLING.md)
- [Backend API Reference](../../docs/API.md)
