import { Router } from "express";
import {
  invoiceStatusBreakdown,
  outstandingClients,
  overview,
  payrollTrend,
  revenueTrend,
} from "../controllers/dashboard.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { tenantMiddleware } from "../middlewares/tenant.middleware";
import { validate } from "../middlewares/validate.middleware";
import { topClientsQuery, trendQuery } from "../schemas/dashboard.schema";

const router = Router();

router.use(requireAuth, tenantMiddleware);

router.get("/overview", overview);
router.get("/revenue-trend", validate({ query: trendQuery }), revenueTrend);
router.get("/invoice-status-breakdown", invoiceStatusBreakdown);
router.get("/payroll-trend", validate({ query: trendQuery }), payrollTrend);
router.get("/outstanding-clients", validate({ query: topClientsQuery }), outstandingClients);

export default router;
