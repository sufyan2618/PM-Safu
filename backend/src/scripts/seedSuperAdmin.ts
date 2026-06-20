import { env } from "../config/env";
import { connectDatabase, disconnectDatabase } from "../config/db";
import { logger } from "../lib/logger";
import { SuperAdminModel } from "../models/superAdmin.model";
import { hashPassword } from "../utils/password";

async function seedSuperAdmin() {
  const email = env.SUPERADMIN_SEED_EMAIL;
  const password = env.SUPERADMIN_SEED_PASSWORD;

  if (!email || !password) {
    logger.error("SUPERADMIN_SEED_EMAIL and SUPERADMIN_SEED_PASSWORD must be set in .env");
    process.exit(1);
  }

  await connectDatabase();

  const existing = await SuperAdminModel.findOne({ email });
  if (existing) {
    logger.info(`Super admin already exists: ${email}`);
    await disconnectDatabase();
    process.exit(0);
  }

  await SuperAdminModel.create({
    name: "Platform Super Admin",
    email,
    passwordHash: await hashPassword(password),
  });

  logger.info(`Super admin created: ${email}`);
  await disconnectDatabase();
  process.exit(0);
}

seedSuperAdmin().catch((error) => {
  logger.error("Seed failed", { error: (error as Error).message });
  process.exit(1);
});
