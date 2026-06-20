import { Router } from "express";
import {
  createTaxRate,
  deleteTaxRate,
  listTaxRates,
  updateTaxRate,
} from "../controllers/taxRate.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { tenantMiddleware } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validate } from "../middlewares/validate.middleware";
import { CompanyRole } from "../config/constants";
import { idParam } from "../schemas/common.schema";
import {
  createTaxRateSchema,
  listTaxRatesQuery,
  updateTaxRateSchema,
} from "../schemas/taxRate.schema";

const router = Router();
const canWrite = requireRole(CompanyRole.COMPANY_ADMIN, CompanyRole.ACCOUNTANT);

router.use(requireAuth, tenantMiddleware);

router.get("/", validate({ query: listTaxRatesQuery }), listTaxRates);
router.post("/", canWrite, validate({ body: createTaxRateSchema }), createTaxRate);
router.patch("/:id", canWrite, validate({ params: idParam, body: updateTaxRateSchema }), updateTaxRate);
router.delete("/:id", canWrite, validate({ params: idParam }), deleteTaxRate);

export default router;
