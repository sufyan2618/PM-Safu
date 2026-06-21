import Stripe from "stripe";
import { env } from "./env";

// Single shared Stripe client for the platform account. The SDK's pinned API
// version is used (no explicit apiVersion) so upgrades happen with the SDK.
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  appInfo: { name: "PM-Safu", url: env.APP_BASE_URL },
});
