# Pre-Commit Quality Checks

This project uses automated pre-commit hooks to ensure code quality before changes are committed.

## Setup

Pre-commit hooks are automatically configured when you install dependencies:

```bash
npm install
```

The `prepare` script in `package.json` runs `husky` to set up the git hooks.

## What Gets Checked

The pre-commit hook runs `lint-staged` which performs the following checks on staged files:

### TypeScript/JavaScript Files (`*.{js,jsx,ts,tsx}`)
- **ESLint**: Lints code and auto-fixes issues where possible
- **Prettier**: Formats code to match project style guidelines

### Configuration Files (`*.{json,md,mdx,yml,yaml}`)
- **Prettier**: Formats configuration and documentation files

## Manual Commands

You can also run these checks manually:

```bash
# Lint all files
npm run lint

# Format all files
npm run format

# Check formatting without modifying files
npm run format:check

# Type check
npm run type-check
```

## Troubleshooting

### Pre-commit hook fails

If the pre-commit hook fails, you'll see output indicating which files have issues. Common fixes:

1. **ESLint errors**: The hook attempts to auto-fix issues. If errors remain, fix them manually.
2. **Prettier formatting**: The hook auto-formats files. Stage the changes and try again.
3. **TypeScript errors**: Run `npm run type-check` to identify type issues.

### Bypassing the hook (not recommended)

If you need to bypass the hook temporarily:

```bash
git commit --no-verify -m "Your commit message"
```

**Warning**: This skips all quality checks and should only be used in exceptional circumstances.

## Configuration

- **Hook script**: `.husky/pre-commit`
- **Lint-staged config**: `package.json` (lint-staged section)
- **ESLint config**: `.eslintrc.json`
- **Prettier config**: `.prettierrc`

## Benefits

- **Reduces CI churn**: Catches issues locally before they reach CI
- **Consistent code style**: Ensures all code follows project formatting standards
- **Faster feedback**: Immediate feedback on code quality during development
- **Actionable output**: Clear error messages guide you to fix issues
