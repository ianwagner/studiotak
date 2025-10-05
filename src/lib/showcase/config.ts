const FLAG_ENV_KEYS = [
  "NEXT_INTERNAL_SHOWCASE",
  "NEXT_PUBLIC_INTERNAL_SHOWCASE",
  "NEXT_PUBLIC_ENABLE_SHOWCASE",
] as const;

const truthyPattern = /^(1|true|yes|on)$/i;

const resolveFlag = (): string | undefined => {
  for (const key of FLAG_ENV_KEYS) {
    const value = process.env[key];
    if (value) {
      return value;
    }
  }

  return undefined;
};

export const isShowcaseEnabled = (): boolean => {
  const raw = resolveFlag();

  if (!raw) {
    return false;
  }

  return truthyPattern.test(raw.trim());
};

export const SHOWCASE_FLAG_KEYS = [...FLAG_ENV_KEYS];
