import { isRecord } from "../utils/isRecord";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export class RetryableVerificationError extends Error {}

export async function verifyOnce(
  params: URLSearchParams,
  signal: AbortSignal,
): Promise<boolean> {
  let response: Response;

  try {
    response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body: params,
      signal,
    });
  } catch (cause) {
    throw new RetryableVerificationError(
      "Turnstile verification request failed",
      { cause },
    );
  }

  if (!response.ok) {
    await response.body?.cancel();

    if (response.status === 429 || response.status >= 500) {
      throw new RetryableVerificationError(
        "Turnstile verification service is temporarily unavailable",
      );
    }

    throw new Error("Turnstile verification service returned an HTTP error");
  }

  const result: unknown = await response.json();

  if (!isRecord(result) || typeof result.success !== "boolean") {
    throw new Error("Turnstile verification service returned an invalid response");
  }

  if (
    !result.success &&
    Array.isArray(result["error-codes"]) &&
    result["error-codes"].includes("internal-error")
  ) {
    throw new RetryableVerificationError(
      "Turnstile verification service returned an internal error",
    );
  }

  return result.success;
}
