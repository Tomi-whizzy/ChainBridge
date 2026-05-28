# Bundle Analysis Guide

This guide explains how to analyze the ChainBridge frontend bundle size, identify heavy modules, and optimize the application for better performance.

## Overview

Bundle analysis helps identify:

- Large dependencies that increase bundle size
- Duplicate dependencies
- Unused code that can be removed
- Opportunities for code splitting
- Impact of new dependencies

## Running Bundle Analysis

### Analyze Full Bundle

Analyzes both client and server bundles:

```bash
npm run analyze
```

This will:

1. Build the production bundle
2. Generate interactive HTML reports
3. Open reports in your browser automatically

Reports are saved to:

- `.next/analyze/client.html` - Client bundle analysis
- `.next/analyze/server.html` - Server bundle analysis

### Analyze Client Bundle Only

```bash
npm run analyze:browser
```

### Analyze Server Bundle Only

```bash
npm run analyze:server
```

## Understanding the Report

### Bundle Analyzer Interface

The interactive report shows:

1. **Treemap Visualization**: Visual representation of bundle composition
   - Each rectangle represents a module
   - Size of rectangle = size of module
   - Color groups related modules

2. **Module Sizes**: Three size metrics for each module
   - **Stat Size**: Size of the original source code
   - **Parsed Size**: Size after minification (before gzip)
   - **Gzipped Size**: Size after gzip compression (actual transfer size)

3. **Search**: Find specific modules or dependencies

### Reading the Treemap

```
┌─────────────────────────────────────────────────┐
│ node_modules                                    │
│ ┌─────────────┐ ┌──────────┐ ┌───────────────┐ │
│ │ @tanstack   │ │ ethers   │ │ next          │ │
│ │ react-query │ │          │ │               │ │
│ │ 45.2 KB     │ │ 120 KB   │ │ 200 KB        │ │
│ └─────────────┘ └──────────┘ └───────────────┘ │
│ ┌──────────────────────────────────────────────┐│
│ │ src/                                         ││
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐     ││
│ │ │ app/     │ │ lib/     │ │ components/│    ││
│ │ │ 30 KB    │ │ 25 KB    │ │ 40 KB      │    ││
│ │ └──────────┘ └──────────┘ └──────────┘     ││
│ └──────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

## Current Bundle Composition

### Top Heavy Modules (Estimated)

Based on typical Next.js + blockchain app:

| Module                  | Parsed Size | Gzipped Size | Notes                  |
| ----------------------- | ----------- | ------------ | ---------------------- |
| `next`                  | ~200 KB     | ~70 KB       | Next.js framework core |
| `react` + `react-dom`   | ~140 KB     | ~45 KB       | React runtime          |
| `ethers`                | ~120 KB     | ~40 KB       | Ethereum library       |
| `@stellar/stellar-sdk`  | ~180 KB     | ~55 KB       | Stellar SDK            |
| `bitcoinjs-lib`         | ~90 KB      | ~30 KB       | Bitcoin library        |
| `@tanstack/react-query` | ~45 KB      | ~15 KB       | Data fetching          |
| `axios`                 | ~30 KB      | ~12 KB       | HTTP client            |
| `zod`                   | ~25 KB      | ~8 KB        | Validation             |
| `zustand`               | ~5 KB       | ~2 KB        | State management       |
| Application code        | ~100 KB     | ~30 KB       | Our code               |

**Total Estimated**: ~935 KB parsed, ~307 KB gzipped

### Bundle Size Targets

| Metric        | Target   | Current | Status        |
| ------------- | -------- | ------- | ------------- |
| First Load JS | < 300 KB | ~307 KB | ⚠️ Near limit |
| Total Bundle  | < 1 MB   | ~935 KB | ✅ Good       |
| Largest Chunk | < 200 KB | ~200 KB | ✅ Good       |

## Identifying Issues

### 1. Duplicate Dependencies

**Problem**: Same library included multiple times

**How to identify**:

- Look for multiple versions of the same package in the treemap
- Check for similar module names (e.g., `lodash` and `lodash-es`)

**Example**:

```
node_modules/
├── lodash@4.17.21 (70 KB)
└── lodash-es@4.17.21 (72 KB)  ← Duplicate!
```

**Solution**:

```bash
# Check for duplicates
npm ls lodash

# Use npm dedupe to remove duplicates
npm dedupe

# Or specify resolution in package.json
{
  "overrides": {
    "lodash": "4.17.21"
  }
}
```

### 2. Unused Dependencies

**Problem**: Dependencies imported but not used

**How to identify**:

- Run `npm run analyze` and look for unexpected large modules
- Use `depcheck` to find unused dependencies

**Example**:

```bash
# Install depcheck
npm install -g depcheck

# Run analysis
depcheck
```

**Solution**:

```bash
# Remove unused dependency
npm uninstall unused-package
```

### 3. Large Dependencies

**Problem**: Single dependency is too large

**How to identify**:

- Look for large rectangles in the treemap
- Check gzipped size > 50 KB

**Solutions**:

#### Option 1: Use Lighter Alternative

```typescript
// Before: moment.js (70 KB)
import moment from "moment";

// After: date-fns (15 KB with tree-shaking)
import { format } from "date-fns";
```

#### Option 2: Import Only What You Need

```typescript
// Before: Import entire library
import _ from "lodash";

// After: Import specific functions
import debounce from "lodash/debounce";
import throttle from "lodash/throttle";
```

#### Option 3: Dynamic Import (Code Splitting)

```typescript
// Before: Static import
import HeavyChart from './HeavyChart';

// After: Dynamic import
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <p>Loading chart...</p>,
});
```

### 4. Unoptimized Images/Assets

**Problem**: Large images or assets in bundle

**How to identify**:

- Look for image files in the treemap
- Check `public/` folder size

**Solution**:

```typescript
// Use Next.js Image component for optimization
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
  priority
/>
```

## Optimization Strategies

### 1. Code Splitting

Split large components into separate chunks:

```typescript
import dynamic from 'next/dynamic';

// Heavy component loaded only when needed
const AdminDashboard = dynamic(() => import('@/components/admin/Dashboard'), {
  loading: () => <Skeleton />,
  ssr: false, // Disable SSR if not needed
});

function AdminPage() {
  return <AdminDashboard />;
}
```

### 2. Tree Shaking

Ensure dependencies support tree shaking:

```typescript
// ✅ Good: Named imports (tree-shakeable)
import { Button, Input } from "@/components/ui";

// ❌ Bad: Default import (includes everything)
import UI from "@/components/ui";
```

### 3. Lazy Loading Routes

Use Next.js route-based code splitting:

```typescript
// app/dashboard/page.tsx
// Automatically code-split by Next.js
export default function DashboardPage() {
  return <Dashboard />;
}
```

### 4. Optimize Dependencies

#### Replace Heavy Dependencies

| Heavy               | Lighter Alternative                   | Size Savings |
| ------------------- | ------------------------------------- | ------------ |
| `moment` (70 KB)    | `date-fns` (15 KB)                    | ~55 KB       |
| `lodash` (70 KB)    | `lodash-es` + tree-shaking (10-20 KB) | ~50 KB       |
| `axios` (30 KB)     | `fetch` (native)                      | ~30 KB       |
| `chart.js` (200 KB) | `recharts` (100 KB)                   | ~100 KB      |

#### Example: Replace Moment with date-fns

```typescript
// Before
import moment from "moment";
const formatted = moment(date).format("YYYY-MM-DD");

// After
import { format } from "date-fns";
const formatted = format(date, "yyyy-MM-dd");
```

### 5. Externalize Large Dependencies

For dependencies that don't change often, consider CDN:

```javascript
// next.config.js
module.exports = {
  experimental: {
    externalDir: true,
  },
};
```

### 6. Remove Unused Code

```bash
# Find unused exports
npx ts-prune

# Remove unused dependencies
npx depcheck
```

## Monitoring Bundle Size

### CI/CD Integration

Add bundle size check to CI:

```yaml
# .github/workflows/bundle-size.yml
name: Bundle Size Check

on: [pull_request]

jobs:
  check-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: andresz1/size-limit-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Size Limit Configuration

Create `.size-limit.json`:

```json
[
  {
    "name": "Client Bundle",
    "path": ".next/static/**/*.js",
    "limit": "300 KB"
  },
  {
    "name": "First Load JS",
    "path": ".next/static/chunks/pages/_app-*.js",
    "limit": "150 KB"
  }
]
```

Install and run:

```bash
npm install --save-dev size-limit @size-limit/file
npx size-limit
```

## Best Practices

### 1. Regular Analysis

- Run bundle analysis before and after adding dependencies
- Set up automated bundle size checks in CI
- Review bundle composition monthly

### 2. Dependency Audit

Before adding a new dependency:

```bash
# Check package size
npm info package-name

# Use bundlephobia.com
open https://bundlephobia.com/package/package-name
```

### 3. Performance Budget

Set and enforce performance budgets:

```javascript
// next.config.js
module.exports = {
  performance: {
    maxAssetSize: 300000, // 300 KB
    maxEntrypointSize: 300000,
  },
};
```

### 4. Lazy Load Heavy Features

```typescript
// Only load wallet libraries when needed
const connectWallet = async (type: "metamask" | "freighter") => {
  if (type === "metamask") {
    const { connectMetaMask } = await import("@/lib/wallets/metamask");
    return connectMetaMask();
  } else {
    const { connectFreighter } = await import("@/lib/wallets/freighter");
    return connectFreighter();
  }
};
```

### 5. Monitor Third-Party Scripts

```typescript
// Use Next.js Script component for third-party scripts
import Script from 'next/script';

<Script
  src="https://analytics.example.com/script.js"
  strategy="lazyOnload"
/>
```

## Troubleshooting

### Bundle Analysis Fails

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try again
npm run analyze
```

### Report Doesn't Open

```bash
# Manually open report
open .next/analyze/client.html
```

### Out of Memory Error

```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm run analyze
```

## Resources

- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [Bundlephobia](https://bundlephobia.com/) - Check package sizes
- [Next.js Performance Docs](https://nextjs.org/docs/advanced-features/measuring-performance)

## Related Documentation

- [Frontend Architecture](./ARCHITECTURE.md)
- [Performance Monitoring](../../docs/PERFORMANCE_MONITORING.md)
