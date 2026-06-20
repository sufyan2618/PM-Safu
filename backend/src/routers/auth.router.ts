import { Router } from "express";
import { z } from "zod";
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  me,
  myCompanies,
  refresh,
  registerCompany,
  resendVerification,
  resetPassword,
  superAdminLogin,
  switchCompany,
  verifyEmail,
} from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { authRateLimiter } from "../middlewares/rate-limit.middleware";
import { objectId } from "../schemas/common.schema";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerCompanySchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../schemas/auth.schema";

const router = Router();

router.post("/register-company", authRateLimiter, validate({ body: registerCompanySchema }), registerCompany);
router.post("/login", authRateLimiter, validate({ body: loginSchema }), login);
router.post("/super-admin/login", authRateLimiter, validate({ body: loginSchema }), superAdminLogin);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.get("/my-companies", requireAuth, myCompanies);
router.post(
  "/switch-company/:companyId",
  requireAuth,
  validate({ params: z.object({ companyId: objectId }) }),
  switchCompany,
);
router.post("/forgot-password", authRateLimiter, validate({ body: forgotPasswordSchema }), forgotPassword);
router.post("/reset-password", authRateLimiter, validate({ body: resetPasswordSchema }), resetPassword);
router.post("/verify-email", authRateLimiter, validate({ body: verifyEmailSchema }), verifyEmail);
router.post(
  "/resend-verification",
  authRateLimiter,
  validate({ body: resendVerificationSchema }),
  resendVerification,
);
router.post("/change-password", requireAuth, validate({ body: changePasswordSchema }), changePassword);

export default router;
