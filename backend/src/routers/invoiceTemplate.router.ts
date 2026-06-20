import { Router } from "express";
import {
  cloneTemplate,
  createTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
  previewSavedTemplate,
  previewUnsavedTemplate,
  setDefaultTemplate,
  updateTemplate,
} from "../controllers/invoiceTemplate.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { tenantMiddleware } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validate } from "../middlewares/validate.middleware";
import { CompanyRole } from "../config/constants";
import { idParam } from "../schemas/common.schema";
import {
  cloneTemplateSchema,
  createTemplateSchema,
  previewTemplateSchema,
  updateTemplateSchema,
} from "../schemas/invoiceTemplate.schema";

const router = Router();

const canWrite = requireRole(CompanyRole.COMPANY_ADMIN, CompanyRole.ACCOUNTANT);

router.use(requireAuth, tenantMiddleware);

router.get("/", listTemplates);
router.post("/", canWrite, validate({ body: createTemplateSchema }), createTemplate);
router.post("/preview", validate({ body: previewTemplateSchema }), previewUnsavedTemplate);
router.get("/:id", validate({ params: idParam }), getTemplate);
router.patch("/:id", canWrite, validate({ params: idParam, body: updateTemplateSchema }), updateTemplate);
router.delete("/:id", canWrite, validate({ params: idParam }), deleteTemplate);
router.post("/:id/clone", canWrite, validate({ params: idParam, body: cloneTemplateSchema }), cloneTemplate);
router.patch("/:id/set-default", canWrite, validate({ params: idParam }), setDefaultTemplate);
router.post("/:id/preview", validate({ params: idParam }), previewSavedTemplate);

export default router;
