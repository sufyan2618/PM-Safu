import { Router } from "express";
import {
  deletePayroll,
  finalizePayroll,
  getPayroll,
  getPayrollSlips,
  listPayroll,
  payrollSummaryReport,
  processPayroll,
} from "../controllers/payroll.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { tenantMiddleware } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validate } from "../middlewares/validate.middleware";
import { CompanyRole } from "../config/constants";
import { idParam } from "../schemas/common.schema";
import { listPayrollQuery, payrollReportQuery, processPayrollSchema } from "../schemas/payroll.schema";

const router = Router();
const canManage = requireRole(CompanyRole.COMPANY_ADMIN, CompanyRole.HR_MANAGER);

router.use(requireAuth, tenantMiddleware);

router.get("/", validate({ query: listPayrollQuery }), listPayroll);
router.get("/reports/summary", validate({ query: payrollReportQuery }), payrollSummaryReport);
router.post("/process", canManage, validate({ body: processPayrollSchema }), processPayroll);
router.get("/:id", validate({ params: idParam }), getPayroll);
router.get("/:id/slips", validate({ params: idParam }), getPayrollSlips);
router.patch("/:id/finalize", canManage, validate({ params: idParam }), finalizePayroll);
router.delete("/:id", canManage, validate({ params: idParam }), deletePayroll);

export default router;
