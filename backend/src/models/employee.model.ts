import mongoose, { Schema } from "mongoose";
import type { Document, Types } from "mongoose";
import { EmployeeStatus, EmploymentType } from "../config/constants";
import { addressSchema, type IAddress } from "./shared";

export interface IBankDetails {
  accountTitle?: string;
  accountNumber?: string;
  bankName?: string;
  branchCode?: string;
}

export interface IEmergencyContact {
  name?: string;
  phone?: string;
  relation?: string;
}

export interface IEmployee extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  departmentId: Types.ObjectId;
  designation: string;
  employmentType: EmploymentType;
  dateOfJoining: Date;
  dateOfLeaving?: Date;
  status: EmployeeStatus;
  bankDetails?: IBankDetails;
  address?: IAddress;
  emergencyContact?: IEmergencyContact;
  salaryStructureId: Types.ObjectId;
  userId?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bankDetailsSchema = new Schema<IBankDetails>(
  {
    accountTitle: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    bankName: { type: String, trim: true },
    branchCode: { type: String, trim: true },
  },
  { _id: false },
);

const emergencyContactSchema = new Schema<IEmergencyContact>(
  {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    relation: { type: String, trim: true },
  },
  { _id: false },
);

const employeeSchema = new Schema<IEmployee>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    employeeCode: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    avatarUrl: { type: String },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    designation: { type: String, required: true, trim: true },
    employmentType: {
      type: String,
      enum: Object.values(EmploymentType),
      default: EmploymentType.FULL_TIME,
    },
    dateOfJoining: { type: Date, required: true },
    dateOfLeaving: { type: Date },
    status: {
      type: String,
      enum: Object.values(EmployeeStatus),
      default: EmployeeStatus.ACTIVE,
      index: true,
    },
    bankDetails: { type: bankDetailsSchema },
    address: { type: addressSchema },
    emergencyContact: { type: emergencyContactSchema },
    salaryStructureId: { type: Schema.Types.ObjectId, ref: "SalaryStructure", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

employeeSchema.index({ companyId: 1, employeeCode: 1 }, { unique: true });

export const EmployeeModel = mongoose.model<IEmployee>("Employee", employeeSchema);
