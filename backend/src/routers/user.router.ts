import { Router } from "express";
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateMyProfile,
  updateUser,
  uploadMyAvatar,
} from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { tenantMiddleware } from "../middlewares/tenant.middleware";
import { requireRole } from "../middlewares/rbac.middleware";
import { validate } from "../middlewares/validate.middleware";
import { uploadSingleImage } from "../middlewares/upload.middleware";
import { CompanyRole } from "../config/constants";
import { idParam } from "../schemas/common.schema";
import { createUserSchema, listUsersQuery, updateMyProfileSchema, updateUserSchema } from "../schemas/user.schema";

const router = Router();

router.use(requireAuth, tenantMiddleware);

// Self-service "me" routes — must come before /:id to avoid param collision.
router.patch("/me", validate({ body: updateMyProfileSchema }), updateMyProfile);
router.post("/me/avatar", uploadSingleImage("avatar"), uploadMyAvatar);

router.get("/", validate({ query: listUsersQuery }), listUsers);
router.post("/", requireRole(CompanyRole.COMPANY_ADMIN), validate({ body: createUserSchema }), createUser);
router.get("/:id", validate({ params: idParam }), getUser);
router.patch(
  "/:id",
  requireRole(CompanyRole.COMPANY_ADMIN),
  validate({ params: idParam, body: updateUserSchema }),
  updateUser,
);
router.delete("/:id", requireRole(CompanyRole.COMPANY_ADMIN), validate({ params: idParam }), deleteUser);

export default router;
