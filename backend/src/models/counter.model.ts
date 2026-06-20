import mongoose, { Schema } from "mongoose";
import type { Document, Types } from "mongoose";
import { CounterType } from "../config/constants";

export interface ICounter extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  type: CounterType;
  seq: number;
}

const counterSchema = new Schema<ICounter>({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  type: { type: String, enum: Object.values(CounterType), required: true },
  seq: { type: Number, default: 0 },
});

counterSchema.index({ companyId: 1, type: 1 }, { unique: true });

export const CounterModel = mongoose.model<ICounter>("Counter", counterSchema);
