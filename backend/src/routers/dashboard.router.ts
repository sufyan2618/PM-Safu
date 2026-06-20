import { Router } from "express";
import {
  arAging,
  collectionMetrics,
  exportReport,
  financialSummary,
  invoiceStatusBreakdown,
  outstandingClients,
  overview,
  payrollByDepartment,
  payrollTrend,
  revenueByClient,
  revenueTrend,
} from "../controllers/dashboard.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { tenantMiddleware } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validate } from "../middlewares/validate.middleware";
import { CompanyRole } from "../config/constants";
import {
  reportExportQuery,
  revenueByClientQuery,
  summaryQuery,
  topClientsQuery,
  trendQuery,
} from "../schemas/dashboard.schema";

const router = Router();

// Company financials are not exposed to self-service staff users.
router.use(
  requireAuth,
  tenantMiddleware,
  requireRole(CompanyRole.COMPANY_ADMIN, CompanyRole.HR_MANAGER, CompanyRole.ACCOUNTANT),
);

router.get("/overview", overview);
router.get("/revenue-trend", validate({ query: trendQuery }), revenueTrend);
router.get("/invoice-status-breakdown", invoiceStatusBreakdown);
router.get("/payroll-trend", validate({ query: trendQuery }), payrollTrend);
router.get("/outstanding-clients", validate({ query: topClientsQuery }), outstandingClients);
router.get("/financial-summary", validate({ query: summaryQuery }), financialSummary);
router.get("/ar-aging", arAging);
router.get("/collection-metrics", validate({ query: summaryQuery }), collectionMetrics);
router.get("/revenue-by-client", validate({ query: revenueByClientQuery }), revenueByClient);
router.get("/payroll-by-department", validate({ query: summaryQuery }), payrollByDepartment);
router.get("/report/export", validate({ query: reportExportQuery }), exportReport);

export default router;
