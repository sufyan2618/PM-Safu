import type { Request, Response } from "express";
import { DepartmentModel } from "../models/department.model";
import { EmployeeModel } from "../models/employee.model";
import { EmployeeStatus } from "../config/constants";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/apiError";
import { sendCreated, sendSuccess } from "../utils/apiResponse";
import { buildMeta, getPagination } from "../utils/pagination";

export const listDepartments = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, sort } = getPagination(req.query);
  const { search } = req.query as { search?: string };

  const filter: Record<string, unknown> = { companyId: req.companyId };
  if (search) filter.name = { $regex: search, $options: "i" };

  const [departments, total] = await Promise.all([
    DepartmentModel.find(filter).sort(sort).skip(skip).limit(limit).populate("headOfDepartment", "firstName lastName"),
    DepartmentModel.countDocuments(filter),
  ]);

  const withCounts = await Promise.all(
    departments.map(async (department) => ({
      ...department.toObject(),
      employeeCount: await EmployeeModel.countDocuments({
        companyId: req.companyId,
        departmentId: department._id,
      }),
    })),
  );

  return sendSuccess(res, { data: withCounts, meta: buildMeta(total, page, limit) });
});

export const createDepartment = asyncHandler(async (req: Request, res: Response) => {
  const department = await DepartmentModel.create({ ...req.body, companyId: req.companyId });
  return sendCreated(res, { message: "Department created", data: department });
});

export const getDepartment = asyncHandler(async (req: Request, res: Response) => {
  const department = await DepartmentModel.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!department) throw ApiError.notFound("Department not found");
  const employeeCount = await EmployeeModel.countDocuments({
    companyId: req.companyId,
    departmentId: department._id,
  });
  return sendSuccess(res, { data: { ...department.toObject(), employeeCount } });
});

export const updateDepartment = asyncHandler(async (req: Request, res: Response) => {
  const department = await DepartmentModel.findOneAndUpdate(
    { _id: req.params.id, companyId: req.companyId },
    req.body,
    { new: true, runValidators: true },
  );
  if (!department) throw ApiError.notFound("Department not found");
  return sendSuccess(res, { message: "Department updated", data: department });
});

export const deleteDepartment = asyncHandler(async (req: Request, res: Response) => {
  const department = await DepartmentModel.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!department) throw ApiError.notFound("Department not found");

  const assigned = await EmployeeModel.countDocuments({
    companyId: req.companyId,
    departmentId: department._id,
    status: { $ne: EmployeeStatus.TERMINATED },
  });
  if (assigned > 0) {
    throw ApiError.conflict("Cannot delete a department with active employees");
  }

  await department.deleteOne();
  return sendSuccess(res, { message: "Department deleted" });
});
