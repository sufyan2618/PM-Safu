import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type { Response } from "express";
import { env } from "../config/env";
import type { AccessTokenPayload } from "../types/jwt.types";

const REFRESH_COOKIE_NAME = "refreshToken";

type AccessTokenInput = Omit<AccessTokenPayload, "type" | "iat" | "exp">;

export function signAccessToken(payload: AccessTokenInput): string {
  return jwt.sign({ ...payload, type: "access" }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  if (decoded.type !== "access") {
    throw new Error("Invalid access token type");
  }
  return decoded;
}

/** Opaque refresh token — random secret returned to the client, only its hash is stored. */
export function generateRefreshToken(): { token: string; tokenHash: string } {
  const token = randomBytes(48).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Convert a duration like "30d" / "15m" / "12h" into milliseconds. */
export function durationToMs(duration: string): number {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/.exec(duration.trim());
  if (!match) return 0;
  const value = Number(match[1]);
  const unit = match[2];
  const unitMs: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * (unitMs[unit ?? "ms"] ?? 1);
}

export function getRefreshTokenExpiry(): Date {
  return new Date(Date.now() + durationToMs(env.JWT_REFRESH_EXPIRES_IN));
}

export function setRefreshTokenCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: durationToMs(env.JWT_REFRESH_EXPIRES_IN),
    path: "/",
  });
}

export function clearRefreshTokenCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export { REFRESH_COOKIE_NAME };
