import { randomUUID } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import { DEFAULT_VERIFICATION_OPTIONS } from "../config/options";
import type { ResolvedVerificationOptions } from "../types";
import { RetryableVerificationError, verifyOnce } from "./client";

export async function verifyToken(
  secret: string,
  token: string,
  ip?: string,
  options: ResolvedVerificationOptions = DEFAULT_VERIFICATION_OPTIONS,
): Promise<boolean> {
  const params = new URLSearchParams({
    secret,
    response: token,
    idempotency_key: randomUUID(),
  });

  if (ip) {
    params.set("remoteip", ip);
  }

  const signal = AbortSignal.timeout(options.timeoutMs);
  let retryDelayMs = Math.min(options.retryDelayMs, options.timeoutMs);

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await verifyOnce(params, signal);
    } catch (error) {
      if (
        !(error instanceof RetryableVerificationError) ||
        attempt >= options.maxRetries ||
        signal.aborted
      ) {
        throw error;
      }

      await setTimeout(retryDelayMs, undefined, { signal });
      retryDelayMs = Math.min(retryDelayMs * 2, options.timeoutMs);
    }
  }
}
