import { Router } from "express";
import {
  createEmployee,
  deleteEmployee,
  getEmployee,
  getEmployeeSalarySlips,
  listEmployees,
  updateEmployee,
  uploadEmployeeAvatar,
} from "../controllers/employee.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { tenantMiddleware } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validate } from "../middlewares/validate.middleware";
import { uploadSingleImage } from "../middlewares/upload.middleware";
import { CompanyRole } from "../config/constants";
import { idParam } from "../schemas/common.schema";
import { createEmployeeSchema, listEmployeesQuery, updateEmployeeSchema } from "../schemas/employee.schema";

const router = Router();
const canWrite = requireRole(CompanyRole.COMPANY_ADMIN, CompanyRole.HR_MANAGER);

router.use(requireAuth, tenantMiddleware);

router.get("/", validate({ query: listEmployeesQuery }), listEmployees);
router.post("/", canWrite, validate({ body: createEmployeeSchema }), createEmployee);
router.get("/:id", validate({ params: idParam }), getEmployee);
router.get("/:id/salary-slips", validate({ params: idParam }), getEmployeeSalarySlips);
router.patch("/:id", canWrite, validate({ params: idParam, body: updateEmployeeSchema }), updateEmployee);
router.delete("/:id", canWrite, validate({ params: idParam }), deleteEmployee);
router.post("/:id/avatar", canWrite, validate({ params: idParam }), uploadSingleImage("avatar"), uploadEmployeeAvatar);

export default router;
