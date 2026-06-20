import { Router } from "express";
import {
  createDepartment,
  deleteDepartment,
  getDepartment,
  listDepartments,
  updateDepartment,
} from "../controllers/department.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { tenantMiddleware } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validate } from "../middlewares/validate.middleware";
import { CompanyRole } from "../config/constants";
import { idParam } from "../schemas/common.schema";
import {
  createDepartmentSchema,
  listDepartmentsQuery,
  updateDepartmentSchema,
} from "../schemas/department.schema";

const router = Router();
const canWrite = requireRole(CompanyRole.COMPANY_ADMIN, CompanyRole.HR_MANAGER);

router.use(requireAuth, tenantMiddleware);

router.get("/", validate({ query: listDepartmentsQuery }), listDepartments);
router.post("/", canWrite, validate({ body: createDepartmentSchema }), createDepartment);
router.get("/:id", validate({ params: idParam }), getDepartment);
router.patch("/:id", canWrite, validate({ params: idParam, body: updateDepartmentSchema }), updateDepartment);
router.delete("/:id", canWrite, validate({ params: idParam }), deleteDepartment);

export default router;
