import { z } from "zod";

export const trendQuery = z.object({
  months: z.coerce.number().int().min(1).max(36).optional(),
});

export const topClientsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
