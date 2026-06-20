import mongoose, { Schema } from "mongoose";
import type { Document, Types } from "mongoose";
import { CompanyRole } from "../config/constants";

export interface IUser extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: CompanyRole;
  isActive: boolean;
  avatarUrl?: string;
  employeeId?: Types.ObjectId;
  invitedBy?: Types.ObjectId;
  lastLoginAt?: Date;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  emailVerified: boolean;
  emailVerificationTokenHash?: string;
  emailVerificationExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(CompanyRole), required: true },
    isActive: { type: Boolean, default: true },
    avatarUrl: { type: String },
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee" },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User" },
    lastLoginAt: { type: Date },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    // Defaults to verified so invited users and existing accounts are unaffected;
    // self-registered company admins are explicitly set to false at sign-up.
    emailVerified: { type: Boolean, default: true },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpiresAt: { type: Date, select: false },
  },
  { timestamps: true },
);

userSchema.index({ companyId: 1, email: 1 }, { unique: true });

export const UserModel = mongoose.model<IUser>("User", userSchema);
