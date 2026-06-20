import { z } from "zod";

export const trendQuery = z.object({
  months: z.coerce.number().int().min(1).max(36).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const topClientsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const summaryQuery = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const revenueByClientQuery = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const reportExportQuery = z.object({
  format: z.enum(["pdf", "csv"]).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
