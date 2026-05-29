# ChainBridge Frontend

Next.js 14 frontend for the ChainBridge cross-chain atomic swap protocol.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain Libraries**:
  - `ethers` - Ethereum interaction
  - `bitcoinjs-lib` - Bitcoin interaction
  - `@stellar/stellar-sdk` - Stellar/Soroban interaction
  - `@stellar/freighter-api` - Freighter wallet integration

## Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

**Troubleshooting:**
- If you encounter `ENOSPC` errors, increase your system's file watcher limit:
  ```bash
  echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
  sudo sysctl -p
  ```
- If `npm install` fails, try clearing the cache:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### 2. Environment Setup

Create a `.env.local` file:

```bash
cp .env.example .env.local
```

Environment variables:

| Variable                      | Description                       | Default                 |
| ----------------------------- | --------------------------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL`         | Backend API URL                   | `http://localhost:8000` |
| `NEXT_PUBLIC_STELLAR_NETWORK` | Stellar network (testnet/mainnet) | `testnet`               |
| `NEXT_PUBLIC_BITCOIN_NETWORK` | Bitcoin network                   | `testnet`               |

**Troubleshooting:**
- Ensure `.env.local` is added to `.gitignore` (it should be by default)
- If environment variables aren't loading, restart the dev server after making changes
- Verify variable names match exactly (case-sensitive, no spaces around `=`)

### 3. Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Troubleshooting:**
- If port 3000 is in use, Next.js will automatically try the next available port (3001, 3002, etc.)
- If you see "Module not found" errors, try:
  ```bash
  rm -rf .next
  npm run dev
  ```
- For TypeScript errors during development, run:
  ```bash
  npm run type-check
  ```

### 4. Production Build

```bash
npm run build
npm run start
```

**Troubleshooting:**
- If the build fails with TypeScript errors, run `npm run type-check` to identify issues
- For build performance issues, increase Node.js memory:
  ```bash
  NODE_OPTIONS=--max-old-space-size=4096 npm run build
  ```
- If static assets are missing, ensure the `public/` directory exists and contains required files

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── app/            # Next.js App Router pages
│   │   ├── layout.tsx  # Root layout
│   │   └── page.tsx    # Home page
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   │   ├── useLocalStorage.ts
│   │   └── useAsync.ts
│   ├── lib/            # Utility libraries
│   │   ├── ethereum.ts # Ethereum wallet functions
│   │   ├── bitcoin.ts  # Bitcoin utilities
│   │   └── stellar.ts  # Stellar/Soroban functions
│   ├── styles/         # Global styles
│   │   └── globals.css
│   └── types/          # TypeScript type definitions
│       └── index.ts
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Scripts

| Script                | Description                           |
| --------------------- | ------------------------------------- |
| `npm run dev`         | Start development server              |
| `npm run build`       | Build for production                  |
| `npm run start`       | Start production server               |
| `npm run lint`        | Run ESLint                            |
| `npm run format`      | Format with Prettier                  |
| `npm run format:check` | Check formatting without modifying    |
| `npm run type-check`  | Run TypeScript type checking          |

**Common Workflows:**

```bash
# Before committing changes
npm run lint && npm run format:check && npm run type-check

# Fix formatting issues
npm run format

# Check for type errors
npm run type-check
```

## Code Quality

All code must pass linting and formatting checks before merging.

### ESLint

```bash
npm run lint
```

**ESLint Rules**:

- No `var` statements (use `const`/`let`)
- Prefer `const` over `let`
- No unused variables (prefix with `_` to suppress)
- Strict equality (`===` not `==`)
- No implicit type coercion
- No console.log (warn on other console methods)
- All React keys required
- No param reassignment

### Prettier

```bash
# Format all files
npm run format

# Check formatting (used in CI)
npm run format:check
```

### TypeScript

```bash
# Type check
npm run type-check
```

### Pre-commit Hooks (Automated Quality Checks)

This project uses Husky and lint-staged for automated pre-commit quality checks. See [PRE_COMMIT_HOOKS.md](./PRE_COMMIT_HOOKS.md) for detailed documentation.

**Quick Setup:**
```bash
# Pre-commit hooks are automatically configured when you install dependencies
npm install
```

The hooks run automatically on each commit and will:
- Run ESLint with auto-fix on staged TypeScript/JavaScript files
- Format staged files with Prettier
- Provide actionable error messages if issues are found

**Manual Verification:**
```bash
# Run the same checks manually
npm run lint
npm run format:check
npm run type-check
```

## Features

### Wallet Integration

The frontend supports multiple blockchain wallets:

- **Stellar**: Freighter wallet
- **Ethereum**: MetaMask and other Web3 wallets
- **Bitcoin**: Bitcoin wallets (manual address input)

### Key Components

- Swap creation and management
- Order book browsing
- Transaction history
- Multi-chain wallet connection

### Create-Swap Funnel Analytics Events

The create-swap funnel emits the following frontend analytics events:

| Event           | Trigger                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------- |
| `swap.start`    | User clicks **Initialize Atomic Swap**                                                            |
| `swap.validate` | Form-level validation result is evaluated before continuing                                       |
| `swap.review`   | Review step opens (post risk disclosure gate)                                                     |
| `swap.submit`   | User confirms swap submission from review modal                                                   |
| `swap.failure`  | Failure path is hit with category only (`validation`, `quote`, `submission`, `wallet`, `unknown`) |

`swap.failure` intentionally records only a coarse category and does not include raw errors, request payloads, wallet addresses, or secrets.

## Development Guidelines

### Component Creation

```tsx
// Use functional components with TypeScript
import { FC } from "react";

interface MyComponentProps {
  title: string;
}

export const MyComponent: FC<MyComponentProps> = ({ title }) => {
  return <div>{title}</div>;
};
```

### Styling

Use Tailwind CSS classes:

```tsx
<div className="flex items-center justify-center p-4 bg-stellar-primary text-white">Content</div>
```

### State Management

- Use React hooks for local state
- Use `useLocalStorage` for persistent state
- Context API for global state (wallet, swap data)

### Theme Tokens and Design Primitives

Global design tokens are defined in `src/styles/globals.css` and split into:

- **Primitives**: spacing (`--space-*`), typography scale (`--font-size-*`), radii (`--radius-*`), and shadows (`--shadow-*`)
- **Semantic tokens**: `--color-bg-*`, `--color-text-*`, `--color-border-*`, and component aliases like `--shadow-card`

For components, prefer semantic tokens over hardcoded values so light/dark themes can be adjusted centrally.

### Unified Wallet Provider and Reconnect Strategy

`UnifiedWalletProvider` wraps the app in `src/app/providers.tsx` and exposes typed chain-aware wallet state/actions.

- Connect actions are normalized with `connectByChain(chain)`
- Active wallet disconnect is exposed with `disconnectActiveWallet()`
- Session restore is best-effort on mount using persisted wallet metadata from `zustand` storage
- If a wallet extension is unavailable or the network changed, restore failure is non-blocking and users can reconnect manually

## Testing

```bash
# Unit tests (when implemented)
npm run test

# E2E tests (when implemented)
npm run test:e2e
```

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy

### Docker

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Run stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

## Troubleshooting

### Module Not Found

Clear Next.js cache:

```bash
rm -rf .next node_modules
npm install
```

### TypeScript Errors

Regenerate type declarations:

```bash
npm run build
```

If TypeScript errors persist, run type-check to identify specific issues:

```bash
npm run type-check
```

### Wallet Connection Issues

- Ensure wallet extension is installed (Freighter for Stellar, MetaMask for Ethereum)
- Check network configuration matches the selected network (testnet/mainnet)
- Verify wallet is unlocked and connected
- Clear browser cache and localStorage if connection fails:
  ```bash
  # In browser console
  localStorage.clear()
  ```

### Pre-commit Hook Failures

If pre-commit hooks fail:

1. Read the error output carefully - it will indicate which files have issues
2. Run the checks manually to see full error details:
   ```bash
   npm run lint
   npm run format:check
   ```
3. Fix the issues, then stage the changes again:
   ```bash
   git add .
   git commit
   ```

To bypass hooks temporarily (not recommended):
```bash
git commit --no-verify -m "Your message"
```

### Build Failures

If production build fails:

1. Check for TypeScript errors:
   ```bash
   npm run type-check
   ```
2. Clear Next.js cache and rebuild:
   ```bash
   rm -rf .next
   npm run build
   ```
3. Increase Node.js memory if build runs out of memory:
   ```bash
   NODE_OPTIONS=--max-old-space-size=4096 npm run build
   ```

### Environment Variables Not Loading

- Ensure `.env.local` file exists in the frontend directory
- Restart the development server after adding/changing environment variables
- Verify variable names start with `NEXT_PUBLIC_` for client-side access
- Check that variable names match exactly (case-sensitive)

### Port Already in Use

If port 3000 is already in use, Next.js will automatically try the next available port. To specify a custom port:

```bash
npm run dev -- -p 3001
```

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../LICENSE) for details.
