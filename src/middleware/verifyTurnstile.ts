import type { NextFunction, Request, Response } from "express";
import { resolveVerificationOptions } from "../config/configuration";
import type { ResolvedVerificationOptions } from "../types";
import { verifyToken } from "../verification/verifyToken";
import { isRecord } from "../utils/isRecord";
import { handleVerificationError } from "./handleVerificationError";

const MAX_TOKEN_LENGTH = 2_048;

export async function verifyTurnstile(
  secret: string,
  req: Request,
  res: Response,
  next: NextFunction,
  options: ResolvedVerificationOptions = resolveVerificationOptions(),
): Promise<Response | void> {
  const body: unknown = req.body;
  const token = isRecord(body)
    ? (body.token ?? body["cf-turnstile-response"])
    : undefined;

  if (token === undefined || token === null || token === "") {
    return handleVerificationError(
      res,
      next,
      400,
      "No token provided",
      options.errorMode,
    );
  }

  if (
    typeof token !== "string" ||
    token.trim().length === 0 ||
    token.length > MAX_TOKEN_LENGTH
  ) {
    return handleVerificationError(
      res,
      next,
      400,
      "Invalid token",
      options.errorMode,
    );
  }

  const ip = req.ip ?? req.socket.remoteAddress;
  let success: boolean;

  try {
    success = await verifyToken(secret, token, ip, options);
  } catch {
    return handleVerificationError(
      res,
      next,
      503,
      "Turnstile verification unavailable",
      options.errorMode,
    );
  }

  if (!success) {
    return handleVerificationError(
      res,
      next,
      400,
      "Invalid token",
      options.errorMode,
    );
  }

  if (isRecord(body)) {
    delete body.token;
    delete body["cf-turnstile-response"];
  }

  next();
}
