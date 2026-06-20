import { randomBytes } from "node:crypto";

export function slugify(input: string): string {
  return input
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** URL-safe random token, used for invoice public share links and password resets. */
export function generateToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}
