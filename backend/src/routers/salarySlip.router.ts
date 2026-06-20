import { Router } from "express";
import {
  getSalarySlip,
  getSalarySlipPdf,
  listSalarySlips,
  markSlipPaid,
} from "../controllers/salarySlip.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { tenantMiddleware } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validate } from "../middlewares/validate.middleware";
import { CompanyRole } from "../config/constants";
import { idParam } from "../schemas/common.schema";
import { listSalarySlipsQuery, markSlipPaidSchema } from "../schemas/salarySlip.schema";

const router = Router();

router.use(requireAuth, tenantMiddleware);

router.get("/", validate({ query: listSalarySlipsQuery }), listSalarySlips);
router.get("/:id", validate({ params: idParam }), getSalarySlip);
router.get("/:id/pdf", validate({ params: idParam }), getSalarySlipPdf);
router.patch(
  "/:id/mark-paid",
  requireRole(CompanyRole.COMPANY_ADMIN, CompanyRole.HR_MANAGER),
  validate({ params: idParam, body: markSlipPaidSchema }),
  markSlipPaid,
);

export default router;
