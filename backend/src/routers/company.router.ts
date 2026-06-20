import { Router } from "express";
import {
  getMyCompany,
  setupCompany,
  updateInvoiceSettings,
  updatePayrollSettings,
  uploadLogo,
} from "../controllers/company.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { tenantMiddleware } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validate } from "../middlewares/validate.middleware";
import { uploadSingleImage } from "../middlewares/upload.middleware";
import { CompanyRole } from "../config/constants";
import {
  invoiceSettingsSchema,
  payrollSettingsSchema,
  updateCompanySetupSchema,
} from "../schemas/company.schema";

const router = Router();

router.use(requireAuth, tenantMiddleware);

router.get("/me", getMyCompany);
router.patch(
  "/setup",
  requireRole(CompanyRole.COMPANY_ADMIN),
  validate({ body: updateCompanySetupSchema }),
  setupCompany,
);
router.post("/logo", requireRole(CompanyRole.COMPANY_ADMIN), uploadSingleImage("logo"), uploadLogo);
router.patch(
  "/invoice-settings",
  requireRole(CompanyRole.COMPANY_ADMIN),
  validate({ body: invoiceSettingsSchema }),
  updateInvoiceSettings,
);
router.patch(
  "/payroll-settings",
  requireRole(CompanyRole.COMPANY_ADMIN),
  validate({ body: payrollSettingsSchema }),
  updatePayrollSettings,
);

export default router;
