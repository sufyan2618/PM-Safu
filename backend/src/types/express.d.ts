import type { AccessTokenPayload } from "./jwt.types";

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
      /** Tenant id injected by tenant.middleware — the single source of truth for scoping. */
      companyId?: string;
    }
  }
}

export {};
