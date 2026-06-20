import { Router } from "express";
import {
  approveCompany,
  getCompany,
  listCompanies,
  listCompanyUsers,
  platformDashboard,
  reactivateCompany,
  rejectCompany,
  suspendCompany,
} from "../controllers/superAdmin.controller";
import { requireAuth, requireSuperAdmin } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { idParam } from "../schemas/common.schema";
import { listCompaniesQuery, rejectCompanySchema } from "../schemas/superAdmin.schema";

const router = Router();

router.use(requireAuth, requireSuperAdmin);

router.get("/dashboard", platformDashboard);
router.get("/companies", validate({ query: listCompaniesQuery }), listCompanies);
router.get("/companies/:id", validate({ params: idParam }), getCompany);
router.get("/companies/:id/users", validate({ params: idParam }), listCompanyUsers);
router.patch("/companies/:id/approve", validate({ params: idParam }), approveCompany);
router.patch(
  "/companies/:id/reject",
  validate({ params: idParam, body: rejectCompanySchema }),
  rejectCompany,
);
router.patch("/companies/:id/suspend", validate({ params: idParam }), suspendCompany);
router.patch("/companies/:id/reactivate", validate({ params: idParam }), reactivateCompany);

export default router;
