import type { NextFunction, Request, Response } from "express";
import { resolveVerificationOptions } from "../config/configuration";
import type { ResolvedVerificationOptions } from "../types";
import { verifyToken } from "../verification/verifyToken";
import { isRecord } from "../utils/isRecord";

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
    return res.status(400).json({
      success: false,
      data: { message: "No token provided" },
    });
  }

  if (
    typeof token !== "string" ||
    token.trim().length === 0 ||
    token.length > MAX_TOKEN_LENGTH
  ) {
    return res.status(400).json({
      success: false,
      data: { message: "Invalid token" },
    });
  }

  const ip = req.ip ?? req.socket.remoteAddress;
  let success: boolean;

  try {
    success = await verifyToken(secret, token, ip, options);
  } catch {
    return res.status(503).json({
      success: false,
      data: { message: "Turnstile verification unavailable" },
    });
  }

  if (!success) {
    return res.status(400).json({
      success: false,
      data: { message: "Invalid token" },
    });
  }

  next();
}
