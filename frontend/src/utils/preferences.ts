export function setPref(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getPref<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return fallback;
    const parsed = JSON.parse(value);
    // Example validation: only allow numbers for certain keys
    if (typeof fallback === "number" && typeof parsed !== "number") return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}
// Avoid storing private keys or sensitive tokens in preferences.
