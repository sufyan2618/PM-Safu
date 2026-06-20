import { Router } from "express";
import {
  createClient,
  deleteClient,
  getClient,
  getClientInvoices,
  listClients,
  updateClient,
} from "../controllers/client.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { tenantMiddleware } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validate } from "../middlewares/validate.middleware";
import { CompanyRole } from "../config/constants";
import { idParam } from "../schemas/common.schema";
import { createClientSchema, listClientsQuery, updateClientSchema } from "../schemas/client.schema";

const router = Router();

const canWrite = requireRole(CompanyRole.COMPANY_ADMIN, CompanyRole.ACCOUNTANT);

router.use(requireAuth, tenantMiddleware);

router.get("/", validate({ query: listClientsQuery }), listClients);
router.post("/", canWrite, validate({ body: createClientSchema }), createClient);
router.get("/:id", validate({ params: idParam }), getClient);
router.get("/:id/invoices", validate({ params: idParam }), getClientInvoices);
router.patch("/:id", canWrite, validate({ params: idParam, body: updateClientSchema }), updateClient);
router.delete("/:id", canWrite, validate({ params: idParam }), deleteClient);

export default router;
