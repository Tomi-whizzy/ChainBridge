import {
  getChainIcon,
  getTokenIcon,
  registerChainIcon,
  registerTokenIcon,
  isChainIconAvailable,
  isTokenIconAvailable,
  FALLBACK_ICON,
} from "@/lib/iconRegistry";

describe("icon registry", () => {
  describe("getChainIcon", () => {
    it("returns icon for known chains", () => {
      expect(getChainIcon("stellar")).not.toBe(FALLBACK_ICON);
      expect(getChainIcon("ethereum")).not.toBe(FALLBACK_ICON);
      expect(getChainIcon("bitcoin")).not.toBe(FALLBACK_ICON);
    });

    it("handles case-insensitive chain names", () => {
      const icon1 = getChainIcon("stellar");
      const icon2 = getChainIcon("STELLAR");
      const icon3 = getChainIcon("Stellar");
      expect(icon1).toBe(icon2);
      expect(icon2).toBe(icon3);
    });

    it("returns fallback icon for unknown chains", () => {
      expect(getChainIcon("unknown")).toBe(FALLBACK_ICON);
    });
  });

  describe("getTokenIcon", () => {
    it("returns icon for known tokens", () => {
      expect(getTokenIcon("xlm")).not.toBe(FALLBACK_ICON);
      expect(getTokenIcon("eth")).not.toBe(FALLBACK_ICON);
      expect(getTokenIcon("btc")).not.toBe(FALLBACK_ICON);
    });

    it("handles case-insensitive token names", () => {
      const icon1 = getTokenIcon("usdt");
      const icon2 = getTokenIcon("USDT");
      expect(icon1).toBe(icon2);
    });

    it("returns fallback icon for unknown tokens", () => {
      expect(getTokenIcon("unknown")).toBe(FALLBACK_ICON);
    });
  });

  describe("registerChainIcon", () => {
    it("registers new chain icon", () => {
      const MockIcon = () => null;
      registerChainIcon("ripple", MockIcon);
      expect(getChainIcon("ripple")).toBe(MockIcon);
    });
  });

  describe("registerTokenIcon", () => {
    it("registers new token icon", () => {
      const MockIcon = () => null;
      registerTokenIcon("xrp", MockIcon);
      expect(getTokenIcon("xrp")).toBe(MockIcon);
    });
  });

  describe("isChainIconAvailable", () => {
    it("returns true for available chains", () => {
      expect(isChainIconAvailable("stellar")).toBe(true);
      expect(isChainIconAvailable("ethereum")).toBe(true);
    });

    it("returns false for unavailable chains", () => {
      expect(isChainIconAvailable("unknown")).toBe(false);
    });
  });

  describe("isTokenIconAvailable", () => {
    it("returns true for available tokens", () => {
      expect(isTokenIconAvailable("xlm")).toBe(true);
      expect(isTokenIconAvailable("eth")).toBe(true);
    });

    it("returns false for unavailable tokens", () => {
      expect(isTokenIconAvailable("unknown")).toBe(false);
    });
  });
});
