import { test, expect } from "@playwright/test";

/**
 * Happy-path smoke test for the swap form at /swap.
 * No real wallet required — verifies UI state without wallet dependency.
 * Issue #427
 */

const SWAP_PAGE = "/swap";

test.describe("Swap form — happy-path smoke (no wallet)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SWAP_PAGE);
  });

  test("page renders form heading", async ({ page }) => {
    await expect(page.getByText("Create Swap")).toBeVisible();
  });

  test("From and To chain-asset selectors are visible", async ({ page }) => {
    await expect(page.getByText("From").first()).toBeVisible();
    await expect(page.getByText("To").first()).toBeVisible();
  });

  test("default route shows stellar XLM as source and bitcoin BTC as destination", async ({
    page,
  }) => {
    // ChainAssetSelector renders the selected asset symbol as button text
    await expect(page.getByRole("button", { name: /XLM/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /BTC/i }).first()).toBeVisible();
  });

  test("amount input accepts a numeric value", async ({ page }) => {
    const amountInput = page.locator('input[type="number"]').first();
    await expect(amountInput).toBeVisible();
    await amountInput.fill("10");
    await expect(amountInput).toHaveValue("10");
  });

  test("submit button is disabled when no wallet is connected", async ({ page }) => {
    const submit = page.getByRole("button", { name: /Connect Wallet to Swap/i });
    await expect(submit).toBeVisible();
    await expect(submit).toBeDisabled();
  });

  test("wallet-connect hint is visible when no wallet connected", async ({ page }) => {
    await expect(page.getByText("Connect a wallet to continue.")).toBeVisible();
  });

  test("submit remains disabled after entering a valid amount with no wallet", async ({ page }) => {
    await page.locator('input[type="number"]').first().fill("5");
    // isConnected is always false in a no-wallet test — canSubmit stays false
    const submit = page.getByRole("button", { name: /Connect Wallet to Swap/i });
    await expect(submit).toBeDisabled();
  });
});
