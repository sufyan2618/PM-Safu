import { Router } from "express";
import {
  exportClients,
  exportEmployees,
  exportInvoices,
  exportPayroll,
  exportSalarySlips,
} from "../controllers/export.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { tenantMiddleware } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { CompanyRole } from "../config/constants";

const router = Router();
const canExport = requireRole(
  CompanyRole.COMPANY_ADMIN,
  CompanyRole.ACCOUNTANT,
  CompanyRole.HR_MANAGER,
);

router.use(requireAuth, tenantMiddleware, canExport);

router.get("/invoices", exportInvoices);
router.get("/clients", exportClients);
router.get("/employees", exportEmployees);
router.get("/payroll", exportPayroll);
router.get("/salary-slips", exportSalarySlips);

export default router;
