import { copyToClipboard } from "@/lib/clipboard";

describe("clipboard utility", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve()),
      },
    });
  });

  it("copies text using modern clipboard API", async () => {
    const result = await copyToClipboard("test value");
    expect(result).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("test value");
  });

  it("falls back to execCommand when clipboard API fails", async () => {
    const clipboard = navigator.clipboard as any;
    clipboard.writeText = jest.fn(() => Promise.reject());
    document.execCommand = jest.fn(() => true);

    const result = await copyToClipboard("fallback test");
    expect(result).toBe(true);
  });

  it("returns false on clipboard operation failure", async () => {
    const clipboard = navigator.clipboard as any;
    clipboard.writeText = jest.fn(() => Promise.reject());
    document.execCommand = jest.fn(() => false);

    const result = await copyToClipboard("failing test");
    expect(result).toBe(false);
  });
});
