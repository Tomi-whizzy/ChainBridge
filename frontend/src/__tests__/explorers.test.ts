import { getExplorerUrl, isValidChain } from "@/lib/explorers";

describe("explorer utilities", () => {
  describe("getExplorerUrl", () => {
    it("generates correct URL for stellar transaction", () => {
      const url = getExplorerUrl("stellar", "abc123", "tx");
      expect(url).toBe("https://stellar.expert/explorer/testnet/tx/abc123");
    });

    it("generates correct URL for ethereum transaction", () => {
      const url = getExplorerUrl("ethereum", "0xabc123", "tx");
      expect(url).toBe("https://sepolia.etherscan.io/tx/0xabc123");
    });

    it("generates correct URL for bitcoin address", () => {
      const url = getExplorerUrl("bitcoin", "1A123", "address");
      expect(url).toBe("https://mempool.space/testnet/address/1A123");
    });

    it("generates correct URL for ethereum address", () => {
      const url = getExplorerUrl("ethereum", "0x123", "address");
      expect(url).toBe("https://sepolia.etherscan.io/address/0x123");
    });

    it("returns # for unsupported chains", () => {
      const url = getExplorerUrl("unknown", "abc123", "tx");
      expect(url).toBe("#");
    });

    it("returns # for unsupported link types", () => {
      const url = getExplorerUrl("bitcoin", "abc123", "contract");
      expect(url).toBe("#");
    });

    it("defaults to tx type", () => {
      const url = getExplorerUrl("ethereum", "0xabc123");
      expect(url).toBe("https://sepolia.etherscan.io/tx/0xabc123");
    });
  });

  describe("isValidChain", () => {
    it("returns true for supported chains", () => {
      expect(isValidChain("stellar")).toBe(true);
      expect(isValidChain("ethereum")).toBe(true);
      expect(isValidChain("bitcoin")).toBe(true);
    });

    it("returns true for uppercase chain names", () => {
      expect(isValidChain("STELLAR")).toBe(true);
      expect(isValidChain("Ethereum")).toBe(true);
    });

    it("returns false for unsupported chains", () => {
      expect(isValidChain("unknown")).toBe(false);
      expect(isValidChain("ripple")).toBe(false);
    });
  });
});
