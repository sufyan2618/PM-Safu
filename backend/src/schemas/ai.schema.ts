import { z } from "zod";
import { objectId } from "./common.schema";

export const invoiceDraftSchema = z.object({
  prompt: z.string().trim().min(3, "Describe the invoice you want to create"),
  // Answers carried back from a previous clarification turn.
  clientId: objectId.optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be YYYY-MM-DD")
    .optional(),
});

export const invoiceDescribeSchema = z.object({
  name: z.string().trim().min(1, "An item name is required"),
  hours: z.coerce.number().min(0).optional(),
  context: z.string().trim().max(500).optional(),
});

export const payrollInsightsQuery = z.object({
  refresh: z.coerce.boolean().optional(),
});

export const payrollChatSchema = z.object({
  payrollId: objectId.optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1, "At least one message is required")
    .max(20),
});
