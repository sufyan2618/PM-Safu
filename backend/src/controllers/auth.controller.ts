import type { Request, Response } from "express";
import { CompanyRole, CompanyStatus, EMAIL_JOBS, PlatformScope, UserType } from "../config/constants";
import { CompanyModel } from "../models/company.model";
import { UserModel } from "../models/user.model";
import { SuperAdminModel } from "../models/superAdmin.model";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/apiError";
import { sendCreated, sendSuccess } from "../utils/apiResponse";
import { comparePassword, hashPassword } from "../utils/password";
import { issueAuthTokens, revokeRefreshToken, rotateRefreshToken } from "../utils/authTokens";
import { clearRefreshTokenCookie, hashToken } from "../lib/token";
import { generateToken } from "../utils/generateSlug";
import { enqueueEmail } from "../queues/email.queue";
import type { ICompany } from "../models/company.model";
import type { IUser } from "../models/user.model";

function sanitizeUser(user: IUser) {
  return {
    id: user._id.toString(),
    companyId: user.companyId.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    avatarUrl: user.avatarUrl,
    lastLoginAt: user.lastLoginAt,
  };
}

function companySummary(company: ICompany) {
  return {
    id: company._id.toString(),
    companyName: company.companyName,
    status: company.status,
    isActive: company.isActive,
    onboardingCompleted: company.onboardingCompleted,
    currency: company.currency,
    logoUrl: company.logoUrl,
  };
}

export const registerCompany = asyncHandler(async (req: Request, res: Response) => {
  const { companyName, registrationEmail, password, adminName } = req.body;

  const existingCompany = await CompanyModel.findOne({ registrationEmail });
  if (existingCompany) {
    throw ApiError.conflict("A company is already registered with this email");
  }

  const company = await CompanyModel.create({
    companyName,
    registrationEmail,
    status: CompanyStatus.PENDING,
  });

  try {
    await UserModel.create({
      companyId: company._id,
      name: adminName,
      email: registrationEmail,
      passwordHash: await hashPassword(password),
      role: CompanyRole.COMPANY_ADMIN,
    });
  } catch (error) {
    // Roll back the company if the admin user couldn't be created.
    await CompanyModel.deleteOne({ _id: company._id });
    throw error;
  }

  await enqueueEmail({ job: EMAIL_JOBS.COMPANY_RECEIVED, to: registrationEmail, companyName });

  return sendCreated(res, {
    message: "Registration submitted. Your company is pending approval.",
    data: companySummary(company),
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await UserModel.findOne({ email }).select("+passwordHash");
  if (!user) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    throw ApiError.unauthorized("Invalid credentials");
  }
  if (!user.isActive) {
    throw ApiError.forbidden("Your account has been deactivated");
  }

  const company = await CompanyModel.findById(user.companyId);
  if (!company) {
    throw ApiError.unauthorized("Invalid credentials");
  }
  if (company.status === CompanyStatus.PENDING) {
    throw ApiError.forbidden("Your company registration is still pending approval");
  }
  if (company.status === CompanyStatus.REJECTED) {
    throw ApiError.forbidden("Your company registration has been rejected");
  }
  if (!company.isActive) {
    throw ApiError.forbidden("Your company account has been suspended");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = await issueAuthTokens(res, {
    sub: user._id.toString(),
    email: user.email,
    userType: UserType.USER,
    companyId: user.companyId.toString(),
    role: user.role,
    ip: req.ip,
  });

  return sendSuccess(res, {
    message: "Login successful",
    data: { accessToken, user: sanitizeUser(user), company: companySummary(company) },
  });
});

export const superAdminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const admin = await SuperAdminModel.findOne({ email }).select("+passwordHash");
  if (!admin || !(await comparePassword(password, admin.passwordHash))) {
    throw ApiError.unauthorized("Invalid credentials");
  }
  if (!admin.isActive) {
    throw ApiError.forbidden("This account has been deactivated");
  }

  admin.lastLoginAt = new Date();
  await admin.save();

  const accessToken = await issueAuthTokens(res, {
    sub: admin._id.toString(),
    email: admin.email,
    userType: UserType.SUPER_ADMIN,
    scope: PlatformScope.SUPER_ADMIN,
    ip: req.ip,
  });

  return sendSuccess(res, {
    message: "Login successful",
    data: {
      accessToken,
      superAdmin: { id: admin._id.toString(), name: admin.name, email: admin.email },
    },
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const presented = req.cookies?.refreshToken;
  if (!presented) {
    throw ApiError.unauthorized("Refresh token missing");
  }

  const accessToken = await rotateRefreshToken(res, presented, async (userId, userType) => {
    if (userType === UserType.SUPER_ADMIN) {
      const admin = await SuperAdminModel.findById(userId);
      if (!admin || !admin.isActive) return null;
      return {
        sub: admin._id.toString(),
        email: admin.email,
        userType: UserType.SUPER_ADMIN,
        scope: PlatformScope.SUPER_ADMIN,
        ip: req.ip,
      };
    }

    const user = await UserModel.findById(userId);
    if (!user || !user.isActive) return null;
    const company = await CompanyModel.findById(user.companyId).select("status isActive");
    if (!company || company.status !== CompanyStatus.APPROVED || !company.isActive) return null;
    return {
      sub: user._id.toString(),
      email: user.email,
      userType: UserType.USER,
      companyId: user.companyId.toString(),
      role: user.role,
      ip: req.ip,
    };
  });

  if (!accessToken) {
    clearRefreshTokenCookie(res);
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  return sendSuccess(res, { message: "Token refreshed", data: { accessToken } });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const presented = req.cookies?.refreshToken;
  if (presented) {
    await revokeRefreshToken(presented);
  }
  clearRefreshTokenCookie(res);
  return sendSuccess(res, { message: "Logged out successfully" });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const principal = req.user;
  if (!principal) {
    throw ApiError.unauthorized("Authentication required");
  }

  if (principal.scope === PlatformScope.SUPER_ADMIN) {
    const admin = await SuperAdminModel.findById(principal.sub);
    if (!admin) throw ApiError.notFound("Account not found");
    return sendSuccess(res, {
      data: {
        type: "super_admin",
        superAdmin: { id: admin._id.toString(), name: admin.name, email: admin.email },
      },
    });
  }

  const user = await UserModel.findById(principal.sub);
  if (!user) throw ApiError.notFound("User not found");
  const company = await CompanyModel.findById(user.companyId);
  if (!company) throw ApiError.notFound("Company not found");

  return sendSuccess(res, {
    data: { type: "user", user: sanitizeUser(user), company: companySummary(company) },
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await UserModel.findOne({ email });

  // Always respond success to avoid leaking which emails exist.
  if (user && user.isActive) {
    const rawToken = generateToken(24);
    user.passwordResetTokenHash = hashToken(rawToken);
    user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    await enqueueEmail({
      job: EMAIL_JOBS.PASSWORD_RESET,
      to: user.email,
      name: user.name,
      token: rawToken,
      email: user.email,
    });
  }

  return sendSuccess(res, {
    message: "If an account exists for that email, a reset link has been sent.",
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, email, newPassword } = req.body;

  const user = await UserModel.findOne({ email }).select(
    "+passwordResetTokenHash +passwordResetExpiresAt",
  );
  if (
    !user ||
    !user.passwordResetTokenHash ||
    user.passwordResetTokenHash !== hashToken(token) ||
    !user.passwordResetExpiresAt ||
    user.passwordResetExpiresAt.getTime() < Date.now()
  ) {
    throw ApiError.badRequest("Invalid or expired reset token");
  }

  user.passwordHash = await hashPassword(newPassword);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  // Invalidate all existing sessions for this user.
  await revokeAllUserTokens(user._id.toString());

  return sendSuccess(res, { message: "Password reset successful. Please log in." });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const principal = req.user;
  if (!principal || principal.scope === PlatformScope.SUPER_ADMIN) {
    throw ApiError.forbidden("Only company users can change their password here");
  }
  const { currentPassword, newPassword } = req.body;

  const user = await UserModel.findById(principal.sub).select("+passwordHash");
  if (!user) throw ApiError.notFound("User not found");

  if (!(await comparePassword(currentPassword, user.passwordHash))) {
    throw ApiError.badRequest("Current password is incorrect");
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  return sendSuccess(res, { message: "Password changed successfully" });
});

async function revokeAllUserTokens(userId: string) {
  const { RefreshTokenModel } = await import("../models/refreshToken.model");
  await RefreshTokenModel.updateMany({ userId, revoked: false }, { $set: { revoked: true } });
}
