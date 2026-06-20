import type { Request, Response } from "express";
import type { Types } from "mongoose";
import { EmployeeModel } from "../models/employee.model";
import { DepartmentModel } from "../models/department.model";
import { SalaryStructureModel } from "../models/salaryStructure.model";
import { SalarySlipModel } from "../models/salarySlip.model";
import { EmployeeStatus } from "../config/constants";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/apiError";
import { sendCreated, sendSuccess } from "../utils/apiResponse";
import { buildMeta, getPagination } from "../utils/pagination";
import { saveBuffer } from "../lib/storage";

async function nextEmployeeCode(companyId: string): Promise<string> {
  const count = await EmployeeModel.countDocuments({ companyId });
  return `EMP-${String(count + 1).padStart(3, "0")}`;
}

export const listEmployees = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, sort } = getPagination(req.query);
  const { departmentId, status, search } = req.query as {
    departmentId?: string;
    status?: EmployeeStatus;
    search?: string;
  };

  const filter: Record<string, unknown> = { companyId: req.companyId };
  if (departmentId) filter.departmentId = departmentId;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { employeeCode: { $regex: search, $options: "i" } },
    ];
  }

  const [employees, total] = await Promise.all([
    EmployeeModel.find(filter).sort(sort).skip(skip).limit(limit).populate("departmentId", "name"),
    EmployeeModel.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: employees, meta: buildMeta(total, page, limit) });
});

export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.companyId!;
  const { salaryStructure, salaryStructureId, employeeCode, ...rest } = req.body;

  const department = await DepartmentModel.findOne({ _id: rest.departmentId, companyId });
  if (!department) throw ApiError.notFound("Department not found");

  // Resolve the salary structure: reference an existing one or create a new one.
  let structureId: Types.ObjectId;
  if (salaryStructureId) {
    const structure = await SalaryStructureModel.findOne({ _id: salaryStructureId, companyId });
    if (!structure) throw ApiError.notFound("Salary structure not found");
    structureId = structure._id;
  } else {
    const structure = await SalaryStructureModel.create({
      ...salaryStructure,
      companyId,
      isTemplate: false,
      name: salaryStructure.name || `${rest.firstName} ${rest.lastName} - Salary`,
    });
    structureId = structure._id;
  }

  const code = employeeCode || (await nextEmployeeCode(companyId));

  const employee = await EmployeeModel.create({
    ...rest,
    companyId,
    employeeCode: code,
    salaryStructureId: structureId,
    createdBy: req.user?.sub,
  });

  return sendCreated(res, { message: "Employee created", data: employee });
});

export const getEmployee = asyncHandler(async (req: Request, res: Response) => {
  const employee = await EmployeeModel.findOne({ _id: req.params.id, companyId: req.companyId })
    .populate("departmentId", "name")
    .populate("salaryStructureId");
  if (!employee) throw ApiError.notFound("Employee not found");
  return sendSuccess(res, { data: employee });
});

export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  if (req.body.departmentId) {
    const department = await DepartmentModel.findOne({
      _id: req.body.departmentId,
      companyId: req.companyId,
    });
    if (!department) throw ApiError.notFound("Department not found");
  }
  if (req.body.salaryStructureId) {
    const structure = await SalaryStructureModel.findOne({
      _id: req.body.salaryStructureId,
      companyId: req.companyId,
    });
    if (!structure) throw ApiError.notFound("Salary structure not found");
  }

  const employee = await EmployeeModel.findOneAndUpdate(
    { _id: req.params.id, companyId: req.companyId },
    req.body,
    { new: true, runValidators: true },
  );
  if (!employee) throw ApiError.notFound("Employee not found");
  return sendSuccess(res, { message: "Employee updated", data: employee });
});

export const deleteEmployee = asyncHandler(async (req: Request, res: Response) => {
  const employee = await EmployeeModel.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!employee) throw ApiError.notFound("Employee not found");

  employee.status = EmployeeStatus.TERMINATED;
  if (!employee.dateOfLeaving) employee.dateOfLeaving = new Date();
  await employee.save();

  return sendSuccess(res, { message: "Employee marked as terminated" });
});

export const getEmployeeSalarySlips = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, sort } = getPagination(req.query);
  const employee = await EmployeeModel.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!employee) throw ApiError.notFound("Employee not found");

  const filter = { companyId: req.companyId, employeeId: employee._id };
  const [slips, total] = await Promise.all([
    SalarySlipModel.find(filter).sort(sort).skip(skip).limit(limit),
    SalarySlipModel.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: slips, meta: buildMeta(total, page, limit) });
});

export const uploadEmployeeAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("No file uploaded");
  const employee = await EmployeeModel.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!employee) throw ApiError.notFound("Employee not found");

  const { url } = await saveBuffer(req.file.buffer, `avatars/${req.companyId}`, req.file.originalname);
  employee.avatarUrl = url;
  await employee.save();

  return sendSuccess(res, { message: "Avatar uploaded", data: { avatarUrl: url } });
});
