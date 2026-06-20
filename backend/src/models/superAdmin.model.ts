import mongoose, { Schema } from "mongoose";
import type { Document, Types } from "mongoose";

export interface ISuperAdmin extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const superAdminSchema = new Schema<ISuperAdmin>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

export const SuperAdminModel = mongoose.model<ISuperAdmin>("SuperAdmin", superAdminSchema);
