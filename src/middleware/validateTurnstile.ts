import type { RequestHandler } from "express";
import { resolveSecret, resolveVerificationOptions } from "../config/configuration";
import type { VerificationOptions } from "../types";
import { verifyTurnstile } from "./verifyTurnstile";

export function validateTurnstile(options?: VerificationOptions): RequestHandler;
export function validateTurnstile(
  secret?: string,
  options?: VerificationOptions,
): RequestHandler;
export function validateTurnstile(
  secretOrOptions?: string | VerificationOptions,
  options?: VerificationOptions,
): RequestHandler {
  const hasOptions = typeof secretOrOptions === "object" && secretOrOptions !== null;
  const resolvedSecret = resolveSecret(hasOptions ? undefined : secretOrOptions);
  const resolvedOptions = resolveVerificationOptions(
    hasOptions ? secretOrOptions : options,
  );

  return function middleware(req, res, next) {
    return verifyTurnstile(resolvedSecret, req, res, next, resolvedOptions);
  };
}
