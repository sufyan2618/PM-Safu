import { Router } from "express";
import { listNotifications, markAllRead, markOneRead } from "../controllers/notification.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { tenantMiddleware } from "../middlewares/tenant.middleware";
import { validate } from "../middlewares/validate.middleware";
import { idParam } from "../schemas/common.schema";

const router = Router();

router.use(requireAuth, tenantMiddleware);

router.get("/", listNotifications);
router.patch("/mark-all-read", markAllRead);
router.patch("/:id/read", validate({ params: idParam }), markOneRead);

export default router;
