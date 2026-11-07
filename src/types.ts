export interface VerificationOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
}

export type ResolvedVerificationOptions = Readonly<Required<VerificationOptions>>;
