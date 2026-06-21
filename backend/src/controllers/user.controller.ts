import type { Request, Response } from "express";
import { CompanyRole, EMAIL_JOBS } from "../config/constants";
import { CompanyModel } from "../models/company.model";
import { EmployeeModel } from "../models/employee.model";
import { UserModel } from "../models/user.model";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/apiError";
import { sendCreated, sendSuccess } from "../utils/apiResponse";
import { buildMeta, getPagination } from "../utils/pagination";
import { hashPassword } from "../utils/password";
import { generateToken } from "../utils/generateSlug";
import { enqueueEmail } from "../queues/email.queue";
import { saveBuffer } from "../lib/storage";

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, sort } = getPagination(req.query);
  const { role, isActive, search } = req.query as {
    role?: string;
    isActive?: boolean;
    search?: string;
  };

  const filter: Record<string, unknown> = { companyId: req.companyId };
  if (role) filter.role = role;
  if (typeof isActive === "boolean") filter.isActive = isActive;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    UserModel.find(filter).sort(sort).skip(skip).limit(limit),
    UserModel.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: users, meta: buildMeta(total, page, limit) });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, role, password } = req.body;

  const existing = await UserModel.findOne({ companyId: req.companyId, email });
  if (existing) throw ApiError.conflict("A user with this email already exists in your company");

  const tempPassword = password || generateToken(6);
  const user = await UserModel.create({
    companyId: req.companyId,
    name,
    email,
    role,
    passwordHash: await hashPassword(tempPassword),
    invitedBy: req.user?.sub,
  });

  // Staff are self-service portal users: link them to their employee record (by
  // email) so salary-slip access is automatically scoped to their own data.
  if (role === CompanyRole.STAFF) {
    const employee = await EmployeeModel.findOne({ companyId: req.companyId, email });
    if (employee) {
      user.employeeId = employee._id;
      await user.save();
      if (!employee.userId) {
        employee.userId = user._id;
        await employee.save();
      }
    }
  }

  const company = await CompanyModel.findById(req.companyId).select("companyName");
  await enqueueEmail({
    job: EMAIL_JOBS.USER_INVITE,
    to: email,
    name,
    companyName: company?.companyName ?? "your company",
    tempPassword,
  });

  return sendCreated(res, { message: "User invited", data: user });
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserModel.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!user) throw ApiError.notFound("User not found");
  return sendSuccess(res, { data: user });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserModel.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!user) throw ApiError.notFound("User not found");

  // Prevent an admin from demoting/deactivating themselves and losing access.
  if (user._id.toString() === req.user?.sub && (req.body.role || req.body.isActive === false)) {
    throw ApiError.badRequest("You cannot change your own role or deactivate yourself");
  }

  Object.assign(user, req.body);
  await user.save();
  return sendSuccess(res, { message: "User updated", data: user });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserModel.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!user) throw ApiError.notFound("User not found");
  if (user._id.toString() === req.user?.sub) {
    throw ApiError.badRequest("You cannot deactivate your own account");
  }

  user.isActive = false;
  await user.save();
  return sendSuccess(res, { message: "User deactivated" });
});

function sanitizeUser(user: import("../models/user.model").IUser) {
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

export const updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const principal = req.user;
  if (!principal) throw ApiError.unauthorized("Authentication required");

  const user = await UserModel.findById(principal.sub);
  if (!user) throw ApiError.notFound("User not found");

  if (req.body.name) user.name = req.body.name.trim();
  await user.save();

  return sendSuccess(res, { message: "Profile updated", data: sanitizeUser(user) });
});

export const uploadMyAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("No file uploaded");

  const principal = req.user;
  if (!principal) throw ApiError.unauthorized("Authentication required");

  const user = await UserModel.findById(principal.sub);
  if (!user) throw ApiError.notFound("User not found");

  const { url } = await saveBuffer(
    req.file.buffer,
    `avatars/users/${user.companyId}`,
    req.file.originalname,
  );
  user.avatarUrl = url;
  await user.save();

  return sendSuccess(res, { message: "Avatar uploaded", data: { avatarUrl: url } });
});
