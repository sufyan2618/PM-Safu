import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodTypeAny } from "zod";
import { ApiError, type FieldError } from "../utils/apiError";

interface ValidationSchemas {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}

function zodToFieldErrors(error: ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

/**
 * Generic validator. Pass any combination of body/params/query Zod schemas.
 * Parsed (and coerced) values are written back onto the request.
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
      if (schemas.query) {
        // Express 5 query is a getter-only property; mutate via defineProperty.
        const parsedQuery = schemas.query.parse(req.query);
        Object.defineProperty(req, "query", { value: parsedQuery, configurable: true });
      }
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(ApiError.badRequest("Validation failed", zodToFieldErrors(error)));
      }
      return next(error);
    }
  };
}
