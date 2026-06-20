import mongoose, { Schema } from "mongoose";
import type { Document, Types } from "mongoose";

export interface IDepartment extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  name: string;
  description?: string;
  headOfDepartment?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    headOfDepartment: { type: Schema.Types.ObjectId, ref: "Employee" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

departmentSchema.index({ companyId: 1, name: 1 }, { unique: true });

export const DepartmentModel = mongoose.model<IDepartment>("Department", departmentSchema);
