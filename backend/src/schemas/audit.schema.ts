import { z } from "zod";
import { objectId, paginationQuery } from "./common.schema";

export const listAuditLogsQuery = paginationQuery.extend({
  action: z.string().trim().optional(),
  status: z.enum(["success", "failed"]).optional(),
  actorId: objectId.optional(),
  targetType: z.string().trim().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});
