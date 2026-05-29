# Quick Start Guide - New Components

## View Live Examples

```bash
cd frontend
npm run dev
```

Then visit: `http://localhost:3000/examples/components`

## Quick Import Reference

```tsx
// Status indicators
import { StatusBadge, StatusPill, StatusDot } from "@/components/ui";

// Chain & Asset selector
import { ChainAssetSelector } from "@/components/ui";
import type { Asset, Chain } from "@/components/ui";

// Portfolio cards
import {
  PortfolioChainCard,
  PortfolioChainGrid,
  PortfolioChainCardSkeleton,
} from "@/components/dashboard";
import type { PortfolioChainData, ChainAsset } from "@/components/dashboard";

// Form guards
import { useFormGuard } from "@/hooks/useFormGuard";
import { MultiStepFormGuard, StepIndicator } from "@/components/forms";
```

## 30-Second Examples

### Status Badge

```tsx
<StatusBadge variant="success" label="Completed" />
<StatusBadge variant="pending" label="Pending" pulse />
<StatusPill variant="processing" label="Syncing" description="Block 1,234,567" />
```

### Chain/Asset Selector

```tsx
const [chain, setChain] = useState<string>();
const [asset, setAsset] = useState<string>();

<ChainAssetSelector
  chains={myChains}
  selectedChain={chain}
  selectedAsset={asset}
  onSelect={(c, a) => {
    setChain(c);
    setAsset(a);
  }}
/>;
```

### Portfolio Cards

```tsx
<PortfolioChainGrid chains={portfolioData} onChainClick={(chain) => console.log(chain)} />
```

### Form Guard

```tsx
const [unsaved, setUnsaved] = useState(false);

<MultiStepFormGuard
  currentStep={1}
  totalSteps={3}
  hasUnsavedChanges={unsaved}
  onSave={async () => await saveData()}
  onDiscard={() => resetForm()}
>
  {/* Your form */}
</MultiStepFormGuard>;
```

## Common Patterns

### Swap Status Display

```tsx
<StatusBadge
  variant={status === "completed" ? "success" : "pending"}
  label={status}
  pulse={status === "pending"}
/>
```

### Chain Health Indicator

```tsx
<div className="flex items-center gap-2">
  <StatusDot variant={health === "operational" ? "success" : "warning"} />
  <span>{health}</span>
</div>
```

### Asset Selection in Forms

```tsx
<ChainAssetSelector
  chains={supportedChains}
  selectedChain={formData.chain}
  selectedAsset={formData.asset}
  onSelect={(chain, asset) => setFormData({ ...formData, chain, asset })}
  label="From Asset"
/>
```

### Dashboard Portfolio View

```tsx
{
  isLoading ? (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <PortfolioChainCardSkeleton />
      <PortfolioChainCardSkeleton />
      <PortfolioChainCardSkeleton />
    </div>
  ) : (
    <PortfolioChainGrid
      chains={portfolioData}
      onChainClick={(chain) => router.push(`/portfolio/${chain}`)}
    />
  );
}
```

### Multi-Step Swap Form

```tsx
function SwapForm() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({});
  const [dirty, setDirty] = useState(false);

  return (
    <>
      <StepIndicator currentStep={step} totalSteps={3} steps={["Select", "Review", "Confirm"]} />

      <MultiStepFormGuard
        currentStep={step}
        totalSteps={3}
        hasUnsavedChanges={dirty}
        onSave={async () => await saveSwap(data)}
        onDiscard={() => {
          setData({});
          setDirty(false);
        }}
      >
        {step === 1 && <SelectStep onChange={() => setDirty(true)} />}
        {step === 2 && <ReviewStep />}
        {step === 3 && <ConfirmStep />}
      </MultiStepFormGuard>
    </>
  );
}
```

## Styling Tips

### Custom Colors

```tsx
// Override variant colors
<StatusBadge variant="info" className="bg-purple-500/10 text-purple-400 border-purple-500/20" />
```

### Size Adjustments

```tsx
// All components support size prop
<StatusBadge size="sm" />
<StatusBadge size="md" /> // default
<StatusBadge size="lg" />
```

### Responsive Grids

```tsx
// Customize grid columns
<PortfolioChainGrid className="grid-cols-1 md:grid-cols-2 xl:grid-cols-4" chains={data} />
```

## TypeScript Tips

### Type-Safe Status

```tsx
import type { StatusVariant } from "@/components/ui";

const getStatusVariant = (status: string): StatusVariant => {
  switch (status) {
    case "completed":
      return "success";
    case "pending":
      return "pending";
    case "failed":
      return "error";
    default:
      return "idle";
  }
};
```

### Type-Safe Chain Data

```tsx
import type { PortfolioChainData } from "@/components/dashboard";

const portfolioData: PortfolioChainData[] = [
  {
    chain: "stellar",
    chainName: "Stellar",
    status: "operational",
    totalValueUsd: 1234.56,
    assets: [
      /* ... */
    ],
  },
];
```

## Troubleshooting

### Component not found?

Make sure you're importing from the correct path:

- UI components: `@/components/ui`
- Dashboard components: `@/components/dashboard`
- Form components: `@/components/forms`
- Hooks: `@/hooks`

### Styles not applying?

Ensure Tailwind is processing the component files. They should be included in `tailwind.config.ts`:

```ts
content: [
  "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  // ...
];
```

### TypeScript errors?

Run type check to see specific errors:

```bash
npm run type-check
```

## More Information

- **Full Documentation**: See `COMPONENTS.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Live Examples**: Visit `/examples/components` when dev server is running

## Support

For issues or questions:

1. Check the documentation files
2. Review the example implementations
3. Inspect the component source code
4. Check existing usage in the codebase
