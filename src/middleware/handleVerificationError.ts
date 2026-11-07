import type { NextFunction, Response } from "express";
import type { ResolvedVerificationOptions } from "../types";

export function handleVerificationError(
  res: Response,
  next: NextFunction,
  status: number,
  message: string,
  errorMode: ResolvedVerificationOptions["errorMode"],
): Response | void {
  if (errorMode === "next") {
    const error = Object.assign(new Error(message), { status });
    next(error);
    return;
  }

  return res.status(status).json({ status, message });
}
