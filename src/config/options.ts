import type { ResolvedVerificationOptions, VerificationOptions } from "../types";

export const DEFAULT_VERIFICATION_OPTIONS: ResolvedVerificationOptions = {
  maxRetries: 2,
  retryDelayMs: 250,
  timeoutMs: 10_000,
  errorMode: "response",
};

export function resolveOptions(
  options: VerificationOptions = {},
  defaults: ResolvedVerificationOptions = DEFAULT_VERIFICATION_OPTIONS,
): ResolvedVerificationOptions {
  if (typeof options !== "object" || options === null || Array.isArray(options)) {
    throw new TypeError("Turnstile verification options must be an object");
  }

  const resolved: ResolvedVerificationOptions = {
    maxRetries:
      options.maxRetries === undefined ? defaults.maxRetries : options.maxRetries,
    retryDelayMs:
      options.retryDelayMs === undefined ? defaults.retryDelayMs : options.retryDelayMs,
    timeoutMs:
      options.timeoutMs === undefined ? defaults.timeoutMs : options.timeoutMs,
    errorMode:
      options.errorMode === undefined ? defaults.errorMode : options.errorMode,
  };

  for (const name of ["maxRetries", "retryDelayMs", "timeoutMs"] as const) {
    const value = resolved[name];
    const minimum = name === "timeoutMs" ? 1 : 0;
    const maximum = name === "maxRetries" ? Number.MAX_SAFE_INTEGER : 2_147_483_647;

    if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
      throw new TypeError(
        `Turnstile ${name} must be an integer between ${minimum} and ${maximum}`,
      );
    }
  }

  if (resolved.errorMode !== "response" && resolved.errorMode !== "next") {
    throw new TypeError('Turnstile errorMode must be "response" or "next"');
  }

  return resolved;
}
