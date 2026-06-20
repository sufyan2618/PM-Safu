import { Router } from "express";
import {
  cancelInvoice,
  createInvoice,
  deleteInvoice,
  getInvoice,
  getInvoicePdf,
  getPublicInvoice,
  getPublicInvoicePdf,
  listInvoices,
  recordPayment,
  sendInvoice,
  updateInvoice,
} from "../controllers/invoice.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { tenantMiddleware } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validate } from "../middlewares/validate.middleware";
import { CompanyRole } from "../config/constants";
import { idParam } from "../schemas/common.schema";
import {
  cancelInvoiceSchema,
  createInvoiceSchema,
  listInvoicesQuery,
  recordPaymentSchema,
  shareTokenParam,
  updateInvoiceSchema,
} from "../schemas/invoice.schema";

const router = Router();

// Public share-link routes (no auth, read-only).
router.get("/public/:shareToken", validate({ params: shareTokenParam }), getPublicInvoice);
router.get("/public/:shareToken/pdf", validate({ params: shareTokenParam }), getPublicInvoicePdf);

router.use(requireAuth, tenantMiddleware);

const canWrite = requireRole(CompanyRole.COMPANY_ADMIN, CompanyRole.ACCOUNTANT);

router.get("/", validate({ query: listInvoicesQuery }), listInvoices);
router.post("/", canWrite, validate({ body: createInvoiceSchema }), createInvoice);
router.get("/:id", validate({ params: idParam }), getInvoice);
router.get("/:id/pdf", validate({ params: idParam }), getInvoicePdf);
router.patch("/:id", canWrite, validate({ params: idParam, body: updateInvoiceSchema }), updateInvoice);
router.delete("/:id", canWrite, validate({ params: idParam }), deleteInvoice);
router.patch("/:id/cancel", canWrite, validate({ params: idParam, body: cancelInvoiceSchema }), cancelInvoice);
router.patch("/:id/send", canWrite, validate({ params: idParam }), sendInvoice);
router.post(
  "/:id/record-payment",
  canWrite,
  validate({ params: idParam, body: recordPaymentSchema }),
  recordPayment,
);

export default router;
