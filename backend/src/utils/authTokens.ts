import type { Response } from "express";
import type { Types } from "mongoose";
import { UserType, type CompanyRole, type PlatformScope } from "../config/constants";
import { RefreshTokenModel } from "../models/refreshToken.model";
import {
  generateRefreshToken,
  getRefreshTokenExpiry,
  hashToken,
  setRefreshTokenCookie,
  signAccessToken,
} from "../lib/token";

interface IssueTokensInput {
  sub: string;
  email: string;
  userType: UserType;
  companyId?: string;
  role?: CompanyRole;
  scope?: PlatformScope;
  ip?: string;
}

/**
 * Issues an access token (JWT) + a rotating opaque refresh token (stored hashed),
 * sets the refresh cookie, and returns the access token.
 */
export async function issueAuthTokens(res: Response, input: IssueTokensInput): Promise<string> {
  const accessToken = signAccessToken({
    sub: input.sub,
    email: input.email,
    ...(input.companyId ? { companyId: input.companyId } : {}),
    ...(input.role ? { role: input.role } : {}),
    ...(input.scope ? { scope: input.scope } : {}),
  });

  const { token, tokenHash } = generateRefreshToken();
  await RefreshTokenModel.create({
    userId: input.sub as unknown as Types.ObjectId,
    userType: input.userType,
    tokenHash,
    expiresAt: getRefreshTokenExpiry(),
    createdByIp: input.ip,
  });

  setRefreshTokenCookie(res, token);
  return accessToken;
}

/**
 * Rotates a refresh token: revokes the old, issues a new one, returns a fresh access token.
 */
export async function rotateRefreshToken(
  res: Response,
  presentedToken: string,
  resolver: (userId: string, userType: UserType) => Promise<IssueTokensInput | null>,
): Promise<string | null> {
  const tokenHash = hashToken(presentedToken);
  const stored = await RefreshTokenModel.findOne({ tokenHash, revoked: false });
  if (!stored || stored.expiresAt.getTime() < Date.now()) {
    return null;
  }

  const input = await resolver(stored.userId.toString(), stored.userType);
  if (!input) {
    return null;
  }

  const { token, tokenHash: newHash } = generateRefreshToken();
  stored.revoked = true;
  stored.replacedByToken = newHash;
  await stored.save();

  await RefreshTokenModel.create({
    userId: stored.userId,
    userType: stored.userType,
    tokenHash: newHash,
    expiresAt: getRefreshTokenExpiry(),
    createdByIp: input.ip,
  });

  const accessToken = signAccessToken({
    sub: input.sub,
    email: input.email,
    ...(input.companyId ? { companyId: input.companyId } : {}),
    ...(input.role ? { role: input.role } : {}),
    ...(input.scope ? { scope: input.scope } : {}),
  });

  setRefreshTokenCookie(res, token);
  return accessToken;
}

export async function revokeRefreshToken(presentedToken: string): Promise<void> {
  const tokenHash = hashToken(presentedToken);
  await RefreshTokenModel.updateOne({ tokenHash }, { $set: { revoked: true } });
}
