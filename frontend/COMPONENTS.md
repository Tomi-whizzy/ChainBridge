# New Components Documentation

This document provides comprehensive documentation for the newly implemented components.

## Table of Contents

1. [Status Badge & Pill Components](#status-badge--pill-components)
2. [Chain & Asset Selector](#chain--asset-selector)
3. [Portfolio Chain Cards](#portfolio-chain-cards)
4. [Multi-Step Form Guard](#multi-step-form-guard)

---

## Status Badge & Pill Components

Location: `frontend/src/components/ui/StatusBadge.tsx`

### Overview

A comprehensive set of status indicator components for displaying various states throughout the application.

### Components

#### StatusBadge

Compact status indicator with optional icon and label.

**Props:**

- `variant`: `"success" | "pending" | "error" | "warning" | "info" | "processing" | "idle" | "paused" | "cancelled"`
- `size`: `"sm" | "md" | "lg"` (default: `"md"`)
- `label`: Optional text label
- `showIcon`: Show/hide icon (default: `true`)
- `pulse`: Enable pulse animation (default: `false`)

**Example:**

```tsx
import { StatusBadge } from "@/components/ui";

<StatusBadge variant="success" label="Completed" />
<StatusBadge variant="pending" label="Pending" pulse />
<StatusBadge variant="processing" label="Syncing" size="sm" />
```

#### StatusPill

Larger status indicator with label and optional description.

**Props:**

- `variant`: Same as StatusBadge
- `size`: `"sm" | "md" | "lg"` (default: `"md"`)
- `label`: Required text label
- `description`: Optional secondary text
- `showIcon`: Show/hide icon (default: `true`)
- `pulse`: Enable pulse animation (default: `false`)

**Example:**

```tsx
import { StatusPill } from "@/components/ui";

<StatusPill
  variant="success"
  label="Transaction Complete"
  description="Confirmed on chain"
/>
<StatusPill
  variant="pending"
  label="Awaiting Confirmation"
  description="2 of 6 confirmations"
  pulse
/>
```

#### StatusDot

Minimal dot indicator for inline status display.

**Props:**

- `variant`: Same as StatusBadge
- `size`: `"sm" | "md" | "lg"` (default: `"md"`)
- `pulse`: Enable pulse animation (default: `false`)

**Example:**

```tsx
import { StatusDot } from "@/components/ui";

<div className="flex items-center gap-2">
  <StatusDot variant="success" />
  <span>Operational</span>
</div>;
```

### Variants

- **success**: Green - Completed, successful operations
- **pending**: Yellow - Waiting, in queue
- **error**: Red - Failed, error states
- **warning**: Orange - Caution, attention needed
- **info**: Brand color - Informational
- **processing**: Blue - Active processing, animated spinner
- **idle**: Gray - Inactive, dormant
- **paused**: Purple - Temporarily stopped
- **cancelled**: Slate - Cancelled operations

---

## Chain & Asset Selector

Location: `frontend/src/components/ui/ChainAssetSelector.tsx`

### Overview

A sophisticated dropdown selector for choosing blockchain networks and their associated assets with search functionality.

### Features

- Multi-chain support with chain-specific filtering
- Real-time search across chains and assets
- Balance display for each asset
- Chain tabs for quick filtering
- Keyboard navigation support
- Responsive design

### Props

```typescript
interface ChainAssetSelectorProps {
  chains: Chain[]; // Array of chains with assets
  selectedChain?: string; // Currently selected chain ID
  selectedAsset?: string; // Currently selected asset symbol
  onSelect: (chain: string, asset: string) => void;
  label?: string; // Optional label above selector
  placeholder?: string; // Placeholder text
  disabled?: boolean; // Disable the selector
  showBalance?: boolean; // Show asset balances (default: true)
  className?: string; // Additional CSS classes
}

interface Chain {
  id: string; // Chain identifier (e.g., "stellar")
  name: string; // Display name (e.g., "Stellar")
  assets: Asset[]; // Available assets on this chain
}

interface Asset {
  symbol: string; // Asset symbol (e.g., "XLM")
  name: string; // Full name (e.g., "Stellar Lumens")
  chain: string; // Parent chain ID
  balance?: string; // Optional balance display
  icon?: string; // Optional custom icon URL
}
```

### Example Usage

```tsx
import { ChainAssetSelector } from "@/components/ui";

const chains = [
  {
    id: "stellar",
    name: "Stellar",
    assets: [
      { symbol: "XLM", name: "Stellar Lumens", chain: "stellar", balance: "1,234.56" },
      { symbol: "USDC", name: "USD Coin", chain: "stellar", balance: "500.00" },
    ],
  },
  {
    id: "ethereum",
    name: "Ethereum",
    assets: [{ symbol: "ETH", name: "Ethereum", chain: "ethereum", balance: "2.5" }],
  },
];

function MyComponent() {
  const [selectedChain, setSelectedChain] = useState<string>();
  const [selectedAsset, setSelectedAsset] = useState<string>();

  const handleSelect = (chain: string, asset: string) => {
    setSelectedChain(chain);
    setSelectedAsset(asset);
  };

  return (
    <ChainAssetSelector
      chains={chains}
      selectedChain={selectedChain}
      selectedAsset={selectedAsset}
      onSelect={handleSelect}
      label="Select Asset"
      showBalance
    />
  );
}
```

### Behavior

1. **Search**: Type to filter chains and assets by name or symbol
2. **Chain Tabs**: Click chain tabs to filter assets by chain
3. **Selection**: Click an asset to select it
4. **Visual Feedback**: Selected items are highlighted with brand color
5. **Icons**: Displays both token and chain icons for context

---

## Portfolio Chain Cards

Location: `frontend/src/components/dashboard/PortfolioChainCard.tsx`

### Overview

Display portfolio information organized by blockchain network with asset breakdowns, status indicators, and activity metrics.

### Components

#### PortfolioChainCard

Individual card displaying portfolio data for a single chain.

**Props:**

```typescript
interface PortfolioChainCardProps {
  data: PortfolioChainData;
  onClick?: () => void; // Optional click handler
  className?: string;
}

interface PortfolioChainData {
  chain: string; // Chain ID
  chainName: string; // Display name
  status: "operational" | "degraded" | "down";
  totalValueUsd: number; // Total portfolio value
  change24h?: number; // 24h percentage change
  assets: ChainAsset[]; // Asset breakdown
  activeSwaps?: number; // Number of active swaps
  pendingTransactions?: number; // Pending transaction count
}

interface ChainAsset {
  symbol: string;
  name: string;
  balance: string;
  valueUsd: number;
  change24h?: number;
}
```

**Example:**

```tsx
import { PortfolioChainCard } from "@/components/dashboard";

const portfolioData = {
  chain: "stellar",
  chainName: "Stellar",
  status: "operational",
  totalValueUsd: 1234.56,
  change24h: 5.23,
  assets: [
    { symbol: "XLM", name: "Stellar Lumens", balance: "1,234.56", valueUsd: 987.65 },
    { symbol: "USDC", name: "USD Coin", balance: "500.00", valueUsd: 500.0 },
  ],
  activeSwaps: 2,
  pendingTransactions: 1,
};

<PortfolioChainCard data={portfolioData} onClick={() => console.log("Card clicked")} />;
```

#### PortfolioChainGrid

Grid container for displaying multiple portfolio cards.

**Props:**

```typescript
interface PortfolioChainGridProps {
  chains: PortfolioChainData[];
  onChainClick?: (chain: string) => void;
  className?: string;
}
```

**Example:**

```tsx
import { PortfolioChainGrid } from "@/components/dashboard";

<PortfolioChainGrid
  chains={portfolioDataArray}
  onChainClick={(chain) => router.push(`/portfolio/${chain}`)}
/>;
```

#### PortfolioChainCardSkeleton

Loading skeleton for portfolio cards.

**Example:**

```tsx
import { PortfolioChainCardSkeleton } from "@/components/dashboard";

{
  isLoading ? (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <PortfolioChainCardSkeleton />
      <PortfolioChainCardSkeleton />
      <PortfolioChainCardSkeleton />
    </div>
  ) : (
    <PortfolioChainGrid chains={data} />
  );
}
```

### Features

- **Status Indicators**: Visual chain health status
- **Value Display**: Total portfolio value with 24h change
- **Asset Breakdown**: Up to 3 assets shown, with overflow indicator
- **Activity Metrics**: Active swaps and pending transactions
- **Hover Effects**: Smooth animations and glow effects
- **Responsive Grid**: Adapts to screen size (1-4 columns)

---

## Multi-Step Form Guard

Location: `frontend/src/hooks/useFormGuard.ts` and `frontend/src/components/forms/MultiStepFormGuard.tsx`

### Overview

Protect users from losing unsaved form data with browser navigation guards and visual warnings.

### Hook: useFormGuard

Custom hook for guarding against unsaved changes.

**Usage:**

```typescript
import { useFormGuard } from "@/hooks/useFormGuard";

function MyForm() {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { confirmNavigation, guardedRouter } = useFormGuard(hasUnsavedChanges, {
    message: "You have unsaved changes. Leave anyway?",
    onBeforeUnload: () => {
      // Custom logic before page unload
      return true; // Return false to prevent default behavior
    },
    onRouteChange: async () => {
      // Custom logic before route change
      return window.confirm("Leave without saving?");
    },
  });

  // Use guardedRouter instead of regular router
  const handleNavigate = () => {
    guardedRouter.push("/other-page");
  };

  return (
    // Your form JSX
  );
}
```

**API:**

```typescript
interface UseFormGuardOptions {
  enabled?: boolean; // Enable/disable guard (default: true)
  message?: string; // Confirmation message
  onBeforeUnload?: () => boolean;
  onRouteChange?: () => boolean | Promise<boolean>;
}

// Returns
{
  confirmNavigation: () => Promise<boolean>;
  guardedRouter: {
    push: (href: string) => Promise<void>;
    replace: (href: string) => Promise<void>;
    back: () => Promise<void>;
    forward: () => Promise<void>;
  }
  isNavigating: boolean;
}
```

### Component: MultiStepFormGuard

Wrapper component for multi-step forms with visual warnings.

**Props:**

```typescript
interface MultiStepFormGuardProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  hasUnsavedChanges: boolean;
  onSave?: () => Promise<void>;
  onDiscard?: () => void;
  className?: string;
}
```

**Example:**

```tsx
import { MultiStepFormGuard, StepIndicator } from "@/components/forms";

function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleSave = async () => {
    await saveToAPI(formData);
    setHasUnsavedChanges(false);
  };

  return (
    <div>
      <StepIndicator
        currentStep={currentStep}
        totalSteps={3}
        steps={["Details", "Review", "Confirm"]}
      />

      <MultiStepFormGuard
        currentStep={currentStep}
        totalSteps={3}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={handleSave}
        onDiscard={() => {
          setFormData({});
          setHasUnsavedChanges(false);
        }}
      >
        {/* Your form content */}
      </MultiStepFormGuard>
    </div>
  );
}
```

### Component: StepIndicator

Visual indicator for multi-step forms.

**Props:**

```typescript
interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps?: string[]; // Optional step labels
  className?: string;
}
```

**Example:**

```tsx
<StepIndicator
  currentStep={2}
  totalSteps={4}
  steps={["Account", "Details", "Review", "Complete"]}
/>
```

### Features

- **Browser Navigation Guard**: Prevents accidental page close/refresh
- **Route Change Guard**: Intercepts Next.js navigation
- **Visual Warning Banner**: Shows when changes are unsaved
- **Modal Confirmation**: Prompts user with save/discard options
- **Step Progress**: Visual indicator of form progress
- **Customizable**: Flexible callbacks and styling

---

## Testing

All components can be tested at `/examples/components` route.

## Styling

All components use:

- Tailwind CSS for styling
- CSS custom properties for theming
- Dark mode support via `dark:` variants
- Consistent spacing and typography from design system

## Accessibility

- Semantic HTML elements
- ARIA labels where appropriate
- Keyboard navigation support
- Focus indicators
- Screen reader friendly

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive
- Touch-friendly interactions
