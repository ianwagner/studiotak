export const monthlyMetaSpendOptions = [
  "Under $10k",
  "$10k–$50k",
  "$50k–$150k",
  "$150k–$500k",
  "$500k+"
] as const;

export function normalizeWebsite(value: string) {
  return value && !/^https?:\/\//i.test(value) ? `https://${value}` : value;
}

export function isValidBrandWebsite(value: string) {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname.includes("."));
  } catch {
    return false;
  }
}

export function isMonthlyMetaSpend(value: string) {
  return monthlyMetaSpendOptions.some((option) => option === value);
}
