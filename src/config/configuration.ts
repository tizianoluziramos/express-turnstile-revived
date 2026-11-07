import { DEFAULT_VERIFICATION_OPTIONS, resolveOptions } from "./options";
import type { ResolvedVerificationOptions, VerificationOptions } from "../types";

let configuredSecret: string | undefined;
let configuredOptions = DEFAULT_VERIFICATION_OPTIONS;

function assertSecret(secret: unknown): asserts secret is string {
  if (secret === undefined) {
    throw new TypeError(
      "No Turnstile secret key configured. Call configureTurnstile(secret) or validateTurnstile(secret)",
    );
  }

  if (typeof secret !== "string" || secret.trim().length === 0) {
    throw new TypeError("The Turnstile secret key must be a non-empty string");
  }
}

export function configureTurnstile(secret: string, options?: VerificationOptions): void {
  assertSecret(secret);
  const resolvedOptions = resolveOptions(options);
  configuredSecret = secret;
  configuredOptions = resolvedOptions;
}

export function resolveVerificationOptions(
  options?: VerificationOptions,
): ResolvedVerificationOptions {
  return resolveOptions(options, configuredOptions);
}

export function resolveSecret(secret: string | undefined = configuredSecret): string {
  assertSecret(secret);
  return secret;
}
