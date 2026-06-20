import { Router } from "express";
import {
  createSalaryStructure,
  deleteSalaryStructure,
  getSalaryStructure,
  listSalaryStructures,
  updateSalaryStructure,
} from "../controllers/salaryStructure.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { tenantMiddleware } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validate } from "../middlewares/validate.middleware";
import { CompanyRole } from "../config/constants";
import { idParam } from "../schemas/common.schema";
import {
  createSalaryStructureSchema,
  listSalaryStructuresQuery,
  updateSalaryStructureSchema,
} from "../schemas/salaryStructure.schema";

const router = Router();
const canWrite = requireRole(CompanyRole.COMPANY_ADMIN, CompanyRole.HR_MANAGER);

router.use(requireAuth, tenantMiddleware);

router.get("/", validate({ query: listSalaryStructuresQuery }), listSalaryStructures);
router.post("/", canWrite, validate({ body: createSalaryStructureSchema }), createSalaryStructure);
router.get("/:id", validate({ params: idParam }), getSalaryStructure);
router.patch("/:id", canWrite, validate({ params: idParam, body: updateSalaryStructureSchema }), updateSalaryStructure);
router.delete("/:id", canWrite, validate({ params: idParam }), deleteSalaryStructure);

export default router;
