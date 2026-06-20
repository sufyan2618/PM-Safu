import { Router } from "express";
import { listAuditActions, listAuditLogs } from "../controllers/audit.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { tenantMiddleware } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validate } from "../middlewares/validate.middleware";
import { CompanyRole } from "../config/constants";
import { listAuditLogsQuery } from "../schemas/audit.schema";

const router = Router();

// Audit logs are sensitive — company admins only.
router.use(requireAuth, tenantMiddleware, requireRole(CompanyRole.COMPANY_ADMIN));

router.get("/", validate({ query: listAuditLogsQuery }), listAuditLogs);
router.get("/actions", listAuditActions);

export default router;
