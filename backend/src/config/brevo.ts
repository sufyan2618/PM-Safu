import { env } from "./env";

export const brevoConfig = {
  apiUrl: "https://api.brevo.com/v3/smtp/email",
  apiKey: env.BREVO_API_KEY,
  sender: {
    email: env.BREVO_SENDER_EMAIL,
    name: env.BREVO_SENDER_NAME,
  },
};
