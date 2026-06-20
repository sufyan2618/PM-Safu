import mongoose, { Schema } from "mongoose";
import type { Document, Types } from "mongoose";
import { UserType } from "../config/constants";

export interface IRefreshToken extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  userType: UserType;
  tokenHash: string;
  expiresAt: Date;
  createdByIp?: string;
  revoked: boolean;
  replacedByToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, refPath: "userType" },
    userType: { type: String, enum: Object.values(UserType), required: true },
    tokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    createdByIp: { type: String },
    revoked: { type: Boolean, default: false },
    replacedByToken: { type: String },
  },
  { timestamps: true },
);

// TTL index: Mongo removes the document automatically once expired.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel = mongoose.model<IRefreshToken>("RefreshToken", refreshTokenSchema);
