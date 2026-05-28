# Frontend Architecture Guide

This document describes the ChainBridge frontend architecture, folder conventions, data flow patterns, and development guidelines.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS
- **State Management**: Zustand + React Query
- **Testing**: Jest + React Testing Library + Playwright
- **Blockchain**: ethers.js, bitcoinjs-lib, Stellar SDK

## Project Structure

```
frontend/
├── public/                    # Static assets
│   ├── manifest.json         # PWA manifest
│   └── sw.js                 # Service worker
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── (orders)/        # Order-related routes (route group)
│   │   ├── (swap)/          # Swap flow routes (route group)
│   │   ├── (tracking)/      # Tracking routes (route group)
│   │   ├── dashboard/       # Dashboard page
│   │   ├── settings/        # Settings page
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   ├── error.tsx        # Error boundary
│   │   ├── loading.tsx      # Loading UI
│   │   └── providers.tsx    # Global providers
│   ├── components/          # React components
│   │   ├── ui/             # Base UI components (buttons, inputs, etc.)
│   │   ├── forms/          # Form components
│   │   ├── layout/         # Layout components (header, footer, nav)
│   │   ├── orders/         # Order-specific components
│   │   ├── swap/           # Swap-specific components
│   │   ├── wallet/         # Wallet connection components
│   │   └── ...             # Feature-specific folders
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useWallet.ts
│   │   ├── useAsync.ts
│   │   └── ...
│   ├── lib/                # Utility libraries and services
│   │   ├── api/           # API client and endpoint wrappers
│   │   ├── wallets/       # Wallet integration utilities
│   │   ├── format/        # Formatting utilities
│   │   ├── i18n/          # Internationalization
│   │   ├── config.ts      # App configuration
│   │   ├── utils.ts       # General utilities
│   │   └── ...
│   ├── styles/            # Global styles
│   │   └── globals.css    # Tailwind + custom CSS
│   ├── types/             # TypeScript type definitions
│   │   ├── api.ts        # API types
│   │   ├── wallet.ts     # Wallet types
│   │   └── index.ts      # Shared types
│   └── utils/            # Utility functions
│       ├── logger.ts
│       └── preferences.ts
├── e2e/                   # End-to-end tests (Playwright)
├── .storybook/           # Storybook configuration
├── docs/                 # Documentation
├── next.config.js        # Next.js configuration
├── tailwind.config.ts    # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## Folder Conventions

### `/src/app` - Pages and Routes

Next.js 14 App Router with file-based routing.

**Conventions:**

- `page.tsx` - Route component
- `layout.tsx` - Shared layout for route segment
- `loading.tsx` - Loading UI (Suspense fallback)
- `error.tsx` - Error boundary
- `not-found.tsx` - 404 page
- `(group)/` - Route group (doesn't affect URL)

**Example:**

```
app/
├── layout.tsx              # Root layout (wraps all pages)
├── page.tsx                # Home page (/)
├── (swap)/                 # Route group (doesn't add /swap to URL)
│   ├── create/
│   │   └── page.tsx       # /create
│   └── review/
│       └── page.tsx       # /review
└── dashboard/
    ├── layout.tsx         # Dashboard layout
    └── page.tsx           # /dashboard
```

### `/src/components` - React Components

Organized by feature or UI category.

**Conventions:**

- Use PascalCase for component files: `OrderCard.tsx`
- Co-locate component-specific styles if needed
- Export components as named exports
- Keep components focused and composable

**Structure:**

```
components/
├── ui/                    # Base UI components (design system)
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   └── ...
├── forms/                 # Form components
│   ├── SwapForm.tsx
│   ├── OrderForm.tsx
│   └── FormField.tsx
├── layout/                # Layout components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Sidebar.tsx
│   └── Navigation.tsx
├── orders/                # Order-specific components
│   ├── OrderCard.tsx
│   ├── OrderList.tsx
│   └── OrderFilters.tsx
├── swap/                  # Swap-specific components
│   ├── SwapCard.tsx
│   ├── SwapProgress.tsx
│   └── SwapTimeline.tsx
└── wallet/                # Wallet components
    ├── WalletConnect.tsx
    ├── WalletBalance.tsx
    └── WalletSelector.tsx
```

**Component Template:**

```typescript
import { FC } from 'react';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export const MyComponent: FC<MyComponentProps> = ({ title, onAction }) => {
  return (
    <div className="p-4">
      <h2>{title}</h2>
      {onAction && <button onClick={onAction}>Action</button>}
    </div>
  );
};
```

### `/src/hooks` - Custom React Hooks

Reusable stateful logic.

**Conventions:**

- Prefix with `use`: `useWallet.ts`
- Return consistent interface (object or tuple)
- Document hook behavior and parameters
- Co-locate hook tests in `__tests__/` subfolder

**Common Hooks:**

- `useAuth()` - Authentication state
- `useWallet()` - Wallet connection and state
- `useAsync()` - Async operation state management
- `useDebounce()` - Debounced values
- `useLocalStorage()` - Persistent local state
- `usePagination()` - Pagination state
- `useToast()` - Toast notifications

**Hook Template:**

```typescript
import { useState, useEffect } from "react";

interface UseMyHookOptions {
  initialValue?: string;
}

export function useMyHook(options: UseMyHookOptions = {}) {
  const [value, setValue] = useState(options.initialValue ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Effect logic
  }, [value]);

  return {
    value,
    setValue,
    loading,
  };
}
```

### `/src/lib` - Libraries and Services

Business logic, API clients, and utilities.

**Conventions:**

- Organize by domain: `api/`, `wallets/`, `format/`
- Export functions, not classes (prefer functional style)
- Keep functions pure when possible
- Document complex logic

**Structure:**

```
lib/
├── api/                   # API client layer
│   ├── client.ts         # Core API client
│   ├── orders.ts         # Orders endpoints
│   ├── swaps.ts          # Swaps endpoints
│   └── htlcs.ts          # HTLCs endpoints
├── wallets/              # Wallet integrations
│   ├── ethereum.ts
│   ├── bitcoin.ts
│   └── stellar.ts
├── format/               # Formatting utilities
│   ├── currency.ts
│   ├── date.ts
│   └── address.ts
├── i18n/                 # Internationalization
│   ├── config.ts
│   └── translations/
└── config.ts             # App configuration
```

### `/src/types` - TypeScript Types

Shared type definitions.

**Conventions:**

- Use interfaces for object shapes
- Use types for unions, intersections, and utilities
- Export types from `index.ts` for easy imports
- Co-locate API types in `api.ts`

**Example:**

```typescript
// types/api.ts
export interface ApiOrderRecord {
  id: string;
  source_chain: string;
  target_chain: string;
  status: "open" | "matched" | "cancelled";
  created_at: string;
}

// types/wallet.ts
export type WalletType = "metamask" | "freighter" | "unisat";

export interface WalletState {
  connected: boolean;
  address: string | null;
  chain: string | null;
}
```

### `/src/utils` - Utility Functions

General-purpose helper functions.

**Conventions:**

- Keep functions small and focused
- Write pure functions when possible
- Add JSDoc comments for complex utilities
- Test thoroughly

## Data Flow Patterns

### 1. Server State (API Data)

Use **React Query** for server state management.

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listOrders, createOrder } from "@/lib/api";

function OrdersList() {
  // Fetch orders
  const {
    data: orders,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: () => listOrders(),
    staleTime: 30_000, // 30 seconds
  });

  const queryClient = useQueryClient();

  // Create order mutation
  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      // Invalidate and refetch orders
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  // ...
}
```

**Benefits:**

- Automatic caching and deduplication
- Background refetching
- Optimistic updates
- Error handling and retries

### 2. Client State (UI State)

Use **Zustand** for global client state.

```typescript
// stores/walletStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WalletState {
  address: string | null;
  chain: string | null;
  connected: boolean;
  connect: (address: string, chain: string) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      chain: null,
      connected: false,
      connect: (address, chain) => set({ address, chain, connected: true }),
      disconnect: () => set({ address: null, chain: null, connected: false }),
    }),
    {
      name: "wallet-storage",
    }
  )
);
```

**Usage:**

```typescript
function WalletButton() {
  const { address, connected, connect, disconnect } = useWalletStore();

  if (connected) {
    return <button onClick={disconnect}>Disconnect {address}</button>;
  }

  return <button onClick={() => connect('0x...', 'ethereum')}>Connect</button>;
}
```

### 3. Local State (Component State)

Use **useState** and **useReducer** for component-local state.

```typescript
function SwapForm() {
  const [amount, setAmount] = useState('');
  const [chain, setChain] = useState<'ethereum' | 'bitcoin'>('ethereum');

  return (
    <form>
      <input value={amount} onChange={(e) => setAmount(e.target.value)} />
      <select value={chain} onChange={(e) => setChain(e.target.value as any)}>
        <option value="ethereum">Ethereum</option>
        <option value="bitcoin">Bitcoin</option>
      </select>
    </form>
  );
}
```

### 4. Form State

Use **controlled components** with validation.

```typescript
import { useState } from 'react';
import { z } from 'zod';

const swapSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  address: z.string().min(1, 'Address is required'),
});

function SwapForm() {
  const [formData, setFormData] = useState({ amount: '', address: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = swapSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        amount: fieldErrors.amount?.[0] ?? '',
        address: fieldErrors.address?.[0] ?? '',
      });
      return;
    }

    // Submit valid data
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.amount}
        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
      />
      {errors.amount && <span>{errors.amount}</span>}
      {/* ... */}
    </form>
  );
}
```

## Styling Conventions

### Tailwind CSS

Use Tailwind utility classes for styling.

**Guidelines:**

- Use semantic color tokens: `bg-primary`, `text-secondary`
- Use spacing scale: `p-4`, `m-2`, `gap-6`
- Use responsive modifiers: `md:flex`, `lg:grid-cols-3`
- Extract repeated patterns to components

**Example:**

```tsx
<div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Title</h2>
  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Action</button>
</div>
```

### Design Tokens

Global design tokens are defined in `src/styles/globals.css`:

```css
:root {
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-4: 1rem;

  /* Colors */
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;

  /* Typography */
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
}
```

## Error Handling

### API Errors

```typescript
import { ApiClientError, normalizeApiError } from "@/lib/api";

try {
  const order = await getOrder("order_123");
} catch (error) {
  const apiError = normalizeApiError(error);

  if (apiError.status === 404) {
    // Handle not found
  } else if (apiError.status >= 500) {
    // Handle server error
  } else {
    // Generic error
  }
}
```

### Component Error Boundaries

```typescript
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## Testing Patterns

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import { OrderCard } from './OrderCard';

test('renders order card', () => {
  render(<OrderCard order={{ id: '1', status: 'open' }} />);
  expect(screen.getByText('open')).toBeInTheDocument();
});
```

### Hook Tests

```typescript
import { renderHook, act } from "@testing-library/react";
import { useAsync } from "./useAsync";

test("useAsync handles async operations", async () => {
  const { result } = renderHook(() => useAsync());

  await act(async () => {
    await result.current.execute(async () => "success");
  });

  expect(result.current.value).toBe("success");
});
```

## Performance Optimization

### Code Splitting

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
});
```

### Memoization

```typescript
import { useMemo, useCallback } from 'react';

function ExpensiveComponent({ data }) {
  const processedData = useMemo(() => {
    return data.map(/* expensive operation */);
  }, [data]);

  const handleClick = useCallback(() => {
    // Handler logic
  }, []);

  return <div>{/* ... */}</div>;
}
```

## Accessibility

- Use semantic HTML elements
- Add ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers
- Maintain color contrast ratios

```tsx
<button
  aria-label="Close dialog"
  onClick={onClose}
  className="focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  <CloseIcon />
</button>
```

## Onboarding Checklist

For new contributors:

1. ✅ Read this architecture guide
2. ✅ Review [API Integration Guide](./API_INTEGRATION.md)
3. ✅ Set up development environment (see README.md)
4. ✅ Run the app locally and explore features
5. ✅ Read component examples in `/src/components`
6. ✅ Review existing tests in `/__tests__`
7. ✅ Make a small contribution (fix typo, add test, etc.)
8. ✅ Ask questions in team chat or GitHub discussions

## Related Documentation

- [API Integration Guide](./API_INTEGRATION.md)
- [Component Documentation](../COMPONENTS.md)
- [Testing Guide](./TESTING.md)
- [Contributing Guidelines](../../CONTRIBUTING.md)
