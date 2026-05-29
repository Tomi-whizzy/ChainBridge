/**
 * Tests for the locale helpers used by Navbar's language selector (#422).
 *
 * The bug being prevented: the selector previously read `pathname.split("/")[0]`
 * directly, so routes that don't start with a locale segment (e.g.
 * `/dashboard/orders`) caused the select to display an out-of-set value.
 * `getLocaleFromPathname` validates against `SUPPORTED_LOCALES` and falls
 * back to `DEFAULT_LOCALE`; `buildLocalizedPath` preserves the current
 * route while swapping the locale prefix.
 */

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  buildLocalizedPath,
  getLocaleFromPathname,
  isSupportedLocale,
  stripLocaleFromPathname,
} from "@/lib/i18n/config";

describe("getLocaleFromPathname", () => {
  it("returns the locale segment when the path starts with a supported locale", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(getLocaleFromPathname(`/${locale}/dashboard`)).toBe(locale);
    }
  });

  it("falls back to DEFAULT_LOCALE when the first segment is not a supported locale", () => {
    expect(getLocaleFromPathname("/dashboard/orders")).toBe(DEFAULT_LOCALE);
    expect(getLocaleFromPathname("/swap")).toBe(DEFAULT_LOCALE);
    expect(getLocaleFromPathname("/")).toBe(DEFAULT_LOCALE);
  });

  it("falls back to DEFAULT_LOCALE on an empty pathname", () => {
    expect(getLocaleFromPathname("")).toBe(DEFAULT_LOCALE);
  });

  it("does not match a near-miss locale string", () => {
    expect(isSupportedLocale("english")).toBe(false);
    expect(getLocaleFromPathname("/english/about")).toBe(DEFAULT_LOCALE);
  });
});

describe("buildLocalizedPath", () => {
  it("prepends the locale to a non-locale route", () => {
    expect(buildLocalizedPath("/dashboard/orders", "es")).toBe(
      "/es/dashboard/orders",
    );
  });

  it("replaces an existing locale prefix instead of stacking it", () => {
    expect(buildLocalizedPath("/en/dashboard", "es")).toBe("/es/dashboard");
  });

  it("maps the root path to `/<locale>`", () => {
    expect(buildLocalizedPath("/", "ar")).toBe("/ar");
  });

  it("preserves query-string-free routes with trailing segments", () => {
    expect(buildLocalizedPath("/en/htlcs", "ja")).toBe("/ja/htlcs");
  });

  it("handles input without a leading slash", () => {
    expect(buildLocalizedPath("dashboard/orders", "zh")).toBe(
      "/zh/dashboard/orders",
    );
  });
});

describe("stripLocaleFromPathname", () => {
  it("removes a supported locale prefix", () => {
    expect(stripLocaleFromPathname("/en/dashboard")).toBe("/dashboard");
    expect(stripLocaleFromPathname("/es/swap/btc")).toBe("/swap/btc");
  });

  it("leaves non-locale paths unchanged", () => {
    expect(stripLocaleFromPathname("/dashboard/orders")).toBe("/dashboard/orders");
  });

  it("collapses a bare locale path to root", () => {
    expect(stripLocaleFromPathname("/en")).toBe("/");
  });
});
