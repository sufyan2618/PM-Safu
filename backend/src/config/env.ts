import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(8000),
  APP_BASE_URL: z.string().url().default("http://localhost:8000"),
  CLIENT_BASE_URL: z.string().url().default("http://localhost:5173"),
  // Origin of the separately deployed super-admin console (allowed by CORS).
  ADMIN_BASE_URL: z.string().url().default("http://localhost:5174"),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  REDIS_URL: z.string().url("REDIS_URL must be a valid URL"),

  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 characters"),
  JWT_REFRESH_SECRET: z.string().min(16).optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),

  BREVO_API_KEY: z.string().min(1, "BREVO_API_KEY is required"),
  BREVO_SENDER_EMAIL: z.string().email("BREVO_SENDER_EMAIL must be a valid email"),
  BREVO_SENDER_NAME: z.string().default("PM-Safu"),

  // Public URL of the brand logo shown in transactional emails. Defaults to the
  // logo bundled with and served by the backend ({APP_BASE_URL}/assets/logo.png).
  // Empty string (e.g. `EMAIL_LOGO_URL=` in .env / passed through by compose) is
  // treated as "not set" so it falls back to the default instead of failing.
  EMAIL_LOGO_URL: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().url().optional(),
  ),

  // Groq AI — optional so the app boots without it; AI endpoints degrade to 503 when unset.
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default("openai/gpt-oss-120b"),
  GROQ_MODEL_FAST: z.string().default("openai/gpt-oss-20b"),
  AI_CACHE_TTL_SECONDS: z.coerce.number().default(86400),

  SUPERADMIN_SEED_EMAIL: z.string().email().optional(),
  SUPERADMIN_SEED_PASSWORD: z.string().min(8).optional(),

  UPLOADS_DIR: z.string().default("./uploads"),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(5),

  COOKIE_SECRET: z.string().min(8).default("change-me-cookie-secret"),

  // Number of active employees above which payroll is processed via a background job.
  PAYROLL_SYNC_THRESHOLD: z.coerce.number().default(50),

  // Stripe (test mode). Secret key drives both platform charges and Connect onboarding;
  // a restricted key (rk_) is recommended over a full secret key (sk_).
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),
  // Optional platform application fee (percent of each invoice payment) routed to the
  // platform account on destination charges. 0 disables the fee.
  STRIPE_PLATFORM_FEE_PERCENT: z.coerce.number().min(0).max(100).default(0),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ");
  // eslint-disable-next-line no-console
  console.error(`Invalid environment variables: ${issues}`);
  process.exit(1);
}

export const env = parsedEnv.data;

export type Env = typeof env;
