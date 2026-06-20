import type { Express } from "express";
import swaggerUi from "swagger-ui-express";

/**
 * Lightweight OpenAPI surface. The authoritative, exhaustive endpoint list is
 * maintained in API_DOCUMENTATION.md. This exposes the high-level groups and
 * the security scheme so the docs UI is usable for quick testing.
 */
const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Smart Invoice & Payroll Management Platform API",
    version: "1.0.0",
    description:
      "Multi-tenant SaaS API for invoices, clients, employees and payroll. See API_DOCUMENTATION.md for the full route reference.",
  },
  servers: [{ url: "/api/v1" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/health": { get: { summary: "Health check", responses: { "200": { description: "OK" } } } },
    "/auth/register-company": {
      post: { summary: "Register company", responses: { "201": { description: "Created" } } },
    },
    "/auth/login": { post: { summary: "Login", responses: { "200": { description: "OK" } } } },
    "/auth/super-admin/login": {
      post: { summary: "Super admin login", responses: { "200": { description: "OK" } } },
    },
  },
};

export function setupSwagger(app: Express) {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
