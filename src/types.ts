export interface VerificationOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  errorMode?: "response" | "next";
}

export type ResolvedVerificationOptions = Readonly<Required<VerificationOptions>>;
