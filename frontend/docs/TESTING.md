# Testing Guide

This guide covers testing practices, utilities, and patterns for the ChainBridge frontend.

## Testing Stack

- **Unit/Integration Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright
- **Visual Tests**: Storybook + Chromatic
- **Accessibility Tests**: axe-core + Playwright

## Test Utilities

### Custom Render Function

We provide a custom `render` function that wraps components with all necessary providers (Router, Theme, React Query, etc.), reducing boilerplate in tests.

**Location**: `src/__tests__/test-utils.tsx`

### Basic Usage

```typescript
import { render, screen } from '@/__tests__/test-utils';
import { MyComponent } from './MyComponent';

test('renders component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello World')).toBeInTheDocument();
});
```

### With Theme

```typescript
import { renderWithTheme, screen } from '@/__tests__/test-utils';
import { ThemedComponent } from './ThemedComponent';

test('renders in dark mode', () => {
  renderWithTheme(<ThemedComponent />, 'dark');
  expect(screen.getByRole('button')).toHaveClass('dark:bg-gray-800');
});
```

### With React Query

```typescript
import { render, screen, waitFor } from '@/__tests__/test-utils';
import { createMockQueryClient } from '@/__tests__/test-utils';
import { OrdersList } from './OrdersList';

test('displays orders from cache', async () => {
  const queryClient = createMockQueryClient();

  // Pre-populate cache
  queryClient.setQueryData(['orders'], [
    { id: '1', status: 'open' },
    { id: '2', status: 'matched' },
  ]);

  render(<OrdersList />, { queryClient });

  await waitFor(() => {
    expect(screen.getByText('open')).toBeInTheDocument();
    expect(screen.getByText('matched')).toBeInTheDocument();
  });
});
```

### With Custom Wrapper

```typescript
import { render, screen } from '@/__tests__/test-utils';
import { MyComponent } from './MyComponent';
import { MyContextProvider } from './MyContext';

test('renders with custom context', () => {
  render(<MyComponent />, {
    wrapper: ({ children }) => (
      <MyContextProvider value="test">
        {children}
      </MyContextProvider>
    ),
  });

  expect(screen.getByText('test')).toBeInTheDocument();
});
```

## Testing Patterns

### Testing Components

#### Basic Component Test

```typescript
import { render, screen } from '@/__tests__/test-utils';
import { Button } from './Button';

describe('Button', () => {
  test('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  test('calls onClick when clicked', async () => {
    const handleClick = jest.fn();
    const { user } = render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

#### Testing Forms

```typescript
import { render, screen, waitFor } from '@/__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import { SwapForm } from './SwapForm';

describe('SwapForm', () => {
  test('validates required fields', async () => {
    const user = userEvent.setup();
    render(<SwapForm />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    expect(await screen.findByText('Amount is required')).toBeInTheDocument();
    expect(await screen.findByText('Address is required')).toBeInTheDocument();
  });

  test('submits valid form', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();
    render(<SwapForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/amount/i), '1.5');
    await user.type(screen.getByLabelText(/address/i), '0x123...');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        amount: '1.5',
        address: '0x123...',
      });
    });
  });
});
```

#### Testing with API Calls

```typescript
import { render, screen, waitFor } from '@/__tests__/test-utils';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { OrdersList } from './OrdersList';

const server = setupServer(
  rest.get('/api/v1/orders', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: '1', status: 'open', source_chain: 'ethereum' },
        { id: '2', status: 'matched', source_chain: 'bitcoin' },
      ])
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('OrdersList', () => {
  test('fetches and displays orders', async () => {
    render(<OrdersList />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('open')).toBeInTheDocument();
      expect(screen.getByText('matched')).toBeInTheDocument();
    });
  });

  test('handles API errors', async () => {
    server.use(
      rest.get('/api/v1/orders', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Server error' }));
      })
    );

    render(<OrdersList />);

    await waitFor(() => {
      expect(screen.getByText(/error loading orders/i)).toBeInTheDocument();
    });
  });
});
```

### Testing Hooks

#### Basic Hook Test

```typescript
import { renderHook, act } from "@testing-library/react";
import { useCounter } from "./useCounter";

describe("useCounter", () => {
  test("increments counter", () => {
    const { result } = renderHook(() => useCounter());

    expect(result.current.count).toBe(0);

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

#### Hook with Async Operations

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { useAsync } from "./useAsync";

describe("useAsync", () => {
  test("handles async operations", async () => {
    const { result } = renderHook(() => useAsync());

    expect(result.current.loading).toBe(false);

    act(() => {
      result.current.execute(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return "success";
      });
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.value).toBe("success");
    });
  });
});
```

#### Hook with React Query

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOrders } from './useOrders';
import { createMockQueryClient } from '@/__tests__/test-utils';

describe('useOrders', () => {
  test('fetches orders', async () => {
    const queryClient = createMockQueryClient();

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useOrders(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toHaveLength(2);
    });
  });
});
```

### Testing Utilities

```typescript
import { formatCurrency, shortenHash } from "./utils";

describe("formatCurrency", () => {
  test("formats USD correctly", () => {
    expect(formatCurrency(1234.56, "USD")).toBe("$1,234.56");
  });

  test("handles zero", () => {
    expect(formatCurrency(0, "USD")).toBe("$0.00");
  });
});

describe("shortenHash", () => {
  test("shortens long hash", () => {
    const hash = "0x1234567890abcdef1234567890abcdef12345678";
    expect(shortenHash(hash)).toBe("0x1234...5678");
  });

  test("returns short hash as-is", () => {
    const hash = "0x1234";
    expect(shortenHash(hash)).toBe("0x1234");
  });
});
```

## Mocking

### Mocking API Calls

```typescript
import { jest } from "@jest/globals";
import * as api from "@/lib/api";

jest.mock("@/lib/api", () => ({
  listOrders: jest.fn(),
  getOrder: jest.fn(),
}));

test("handles order list", async () => {
  (api.listOrders as jest.Mock).mockResolvedValue([{ id: "1", status: "open" }]);

  // Test component
});
```

### Mocking Wallet

```typescript
jest.mock("@/hooks/useWallet", () => ({
  useWallet: () => ({
    connected: true,
    address: "0x1234567890abcdef1234567890abcdef12345678",
    chain: "ethereum",
    connect: jest.fn(),
    disconnect: jest.fn(),
  }),
}));
```

### Mocking Next.js Router

```typescript
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => "/test-path",
  useSearchParams: () => new URLSearchParams(),
}));
```

## Accessibility Testing

```typescript
import { render } from '@/__tests__/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MyComponent } from './MyComponent';

expect.extend(toHaveNoViolations);

test('has no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## E2E Testing (Playwright)

### Basic E2E Test

```typescript
import { test, expect } from "@playwright/test";

test("user can create a swap", async ({ page }) => {
  await page.goto("/create");

  await page.fill('[name="amount"]', "1.5");
  await page.fill('[name="address"]', "0x123...");
  await page.click('button[type="submit"]');

  await expect(page.locator("text=Swap created")).toBeVisible();
});
```

### Testing Wallet Connection

```typescript
test("user can connect wallet", async ({ page, context }) => {
  // Mock MetaMask
  await context.addInitScript(() => {
    (window as any).ethereum = {
      request: async ({ method }: { method: string }) => {
        if (method === "eth_requestAccounts") {
          return ["0x1234567890abcdef1234567890abcdef12345678"];
        }
      },
    };
  });

  await page.goto("/");
  await page.click('button:has-text("Connect Wallet")');

  await expect(page.locator("text=0x1234...5678")).toBeVisible();
});
```

## Coverage

Run tests with coverage:

```bash
npm run test:coverage
```

Coverage thresholds are configured in `jest.config.ts`:

```typescript
{
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}
```

## Best Practices

1. **Test user behavior, not implementation**: Focus on what users see and do
2. **Use semantic queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Avoid testing implementation details**: Don't test internal state or methods
4. **Keep tests isolated**: Each test should be independent
5. **Use descriptive test names**: Clearly describe what is being tested
6. **Mock external dependencies**: API calls, timers, random values
7. **Test error states**: Don't just test the happy path
8. **Use waitFor for async**: Always wait for async operations to complete
9. **Clean up after tests**: Use `afterEach` to reset mocks and state
10. **Write tests first (TDD)**: Consider writing tests before implementation

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui

# Run accessibility tests
npm run test:a11y
```

## Debugging Tests

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Debug with Chrome DevTools

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome.

## Related Documentation

- [Frontend Architecture](./ARCHITECTURE.md)
- [API Integration Guide](./API_INTEGRATION.md)
- [Component Documentation](../COMPONENTS.md)
