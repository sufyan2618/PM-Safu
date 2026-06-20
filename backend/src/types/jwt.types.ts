import type { CompanyRole, PlatformScope } from "../config/constants";

export interface AccessTokenPayload {
  /** Subject — the user id (company user or super admin). */
  sub: string;
  type: "access";
  /** Present for company users, absent for super admins. */
  companyId?: string;
  role?: CompanyRole;
  /** Present only for super admins. */
  scope?: PlatformScope;
  email: string;
  iat?: number;
  exp?: number;
}

export type AuthenticatedUser = AccessTokenPayload;
