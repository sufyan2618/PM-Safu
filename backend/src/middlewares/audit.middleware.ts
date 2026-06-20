import type { NextFunction, Request, Response } from "express";
import { UserType } from "../config/constants";
import { recordAudit } from "../utils/audit";

const SKIP_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const OBJECT_ID = /^[a-f\d]{24}$/i;

/** Maps an HTTP method to a default action verb when no explicit sub-action exists. */
const METHOD_VERB: Record<string, string> = {
  POST: "create",
  PUT: "update",
  PATCH: "update",
  DELETE: "delete",
};

function singularize(resource: string): string {
  if (resource.endsWith("ies")) return `${resource.slice(0, -3)}y`;
  if (resource.endsWith("s")) return resource.slice(0, -1);
  return resource;
}

function toTargetType(resource: string): string {
  return singularize(resource)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

interface DerivedAction {
  action: string;
  targetType?: string;
  targetId?: string;
}

/** Derives a stable, human-mappable action label from the request path + method. */
function deriveAction(method: string, path: string): DerivedAction {
  const segments = path.split("/").filter(Boolean);
  const resource = segments[0];
  if (!resource) return { action: `${method.toLowerCase()}.request` };

  const rest = segments.slice(1);
  const targetId = rest.find((segment) => OBJECT_ID.test(segment));

  // A trailing, non-id segment denotes an explicit sub-action (e.g. "send", "finalize").
  const last = rest[rest.length - 1];
  const explicit = last && !OBJECT_ID.test(last) ? last.replace(/-/g, "_") : undefined;

  const verb = explicit ?? METHOD_VERB[method] ?? method.toLowerCase();
  const noun = singularize(resource).replace(/-/g, "_");

  return { action: `${noun}.${verb}`, targetType: toTargetType(resource), targetId };
}

/**
 * Records an audit entry for every state-changing request made by a company user.
 * Attaches a `finish` listener so the final status code is known, and so auditing
 * never blocks or breaks the actual request.
 */
export function auditLogger(req: Request, res: Response, next: NextFunction) {
  if (SKIP_METHODS.has(req.method)) return next();

  res.on("finish", () => {
    const user = req.user;
    // Only audit authenticated company users; super-admin actions are audited separately.
    if (!user?.companyId || user.scope) return;

    const { action, targetType, targetId } = deriveAction(req.method, req.path);

    void recordAudit({
      companyId: user.companyId,
      actorId: user.sub,
      actorType: UserType.USER,
      actorEmail: user.email,
      actorRole: user.role,
      action,
      targetType,
      targetId,
      status: res.statusCode >= 400 ? "failed" : "success",
      statusCode: res.statusCode,
      method: req.method,
      path: req.originalUrl.split("?")[0],
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  });

  next();
}
