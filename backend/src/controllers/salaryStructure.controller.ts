import type { Request, Response } from "express";
import { EmployeeStatus } from "../config/constants";
import { SalaryStructureModel } from "../models/salaryStructure.model";
import { EmployeeModel } from "../models/employee.model";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/apiError";
import { sendCreated, sendSuccess } from "../utils/apiResponse";
import { buildMeta, getPagination } from "../utils/pagination";

export const listSalaryStructures = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, sort } = getPagination(req.query);
  const { isTemplate, search } = req.query as { isTemplate?: boolean; search?: string };

  const filter: Record<string, unknown> = { companyId: req.companyId };
  if (typeof isTemplate === "boolean") filter.isTemplate = isTemplate;
  if (search) filter.name = { $regex: search, $options: "i" };

  const [structures, total] = await Promise.all([
    SalaryStructureModel.find(filter).sort(sort).skip(skip).limit(limit),
    SalaryStructureModel.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: structures, meta: buildMeta(total, page, limit) });
});

export const createSalaryStructure = asyncHandler(async (req: Request, res: Response) => {
  const structure = await SalaryStructureModel.create({ ...req.body, companyId: req.companyId });
  return sendCreated(res, { message: "Salary structure created", data: structure });
});

export const getSalaryStructure = asyncHandler(async (req: Request, res: Response) => {
  const structure = await SalaryStructureModel.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!structure) throw ApiError.notFound("Salary structure not found");
  return sendSuccess(res, { data: structure });
});

export const updateSalaryStructure = asyncHandler(async (req: Request, res: Response) => {
  const structure = await SalaryStructureModel.findOneAndUpdate(
    { _id: req.params.id, companyId: req.companyId },
    req.body,
    { new: true, runValidators: true },
  );
  if (!structure) throw ApiError.notFound("Salary structure not found");
  return sendSuccess(res, { message: "Salary structure updated", data: structure });
});

export const deleteSalaryStructure = asyncHandler(async (req: Request, res: Response) => {
  const structure = await SalaryStructureModel.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!structure) throw ApiError.notFound("Salary structure not found");

  const assigned = await EmployeeModel.countDocuments({
    companyId: req.companyId,
    salaryStructureId: structure._id,
    status: { $ne: EmployeeStatus.TERMINATED },
  });
  if (assigned > 0) {
    throw ApiError.conflict("Cannot delete a salary structure assigned to active employees");
  }

  await structure.deleteOne();
  return sendSuccess(res, { message: "Salary structure deleted" });
});
