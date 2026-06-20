import { Router } from "express";
import {
  aiStatus,
  invoiceDescribe,
  invoiceDraft,
  payrollChat,
  payrollInsights,
} from "../controllers/ai.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { tenantMiddleware } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validate } from "../middlewares/validate.middleware";
import { aiRateLimiter } from "../middlewares/rate-limit.middleware";
import { CompanyRole } from "../config/constants";
import { idParam } from "../schemas/common.schema";
import {
  invoiceDescribeSchema,
  invoiceDraftSchema,
  payrollChatSchema,
  payrollInsightsQuery,
} from "../schemas/ai.schema";

const router = Router();

router.use(requireAuth, tenantMiddleware, aiRateLimiter);

router.get("/status", aiStatus);

const canInvoice = requireRole(CompanyRole.COMPANY_ADMIN, CompanyRole.ACCOUNTANT);
const canPayroll = requireRole(
  CompanyRole.COMPANY_ADMIN,
  CompanyRole.HR_MANAGER,
  CompanyRole.ACCOUNTANT,
);

router.post("/invoice/draft", canInvoice, validate({ body: invoiceDraftSchema }), invoiceDraft);
router.post("/invoice/describe", canInvoice, validate({ body: invoiceDescribeSchema }), invoiceDescribe);

router.get(
  "/payroll/:id/insights",
  canPayroll,
  validate({ params: idParam, query: payrollInsightsQuery }),
  payrollInsights,
);
router.post("/payroll/chat", canPayroll, validate({ body: payrollChatSchema }), payrollChat);

export default router;
