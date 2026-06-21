import { Router } from "express";
import { getConnectStatus, startConnectOnboarding } from "../controllers/payment.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { tenantMiddleware } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { CompanyRole } from "../config/constants";

const router = Router();

router.use(requireAuth, tenantMiddleware);

const adminOnly = requireRole(CompanyRole.COMPANY_ADMIN);

router.post("/connect/onboard", adminOnly, startConnectOnboarding);
router.get("/connect/status", adminOnly, getConnectStatus);

export default router;
