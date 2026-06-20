import { z } from "zod";
import { BaseTheme } from "../config/constants";
import { hexColor } from "./common.schema";

const layoutSchema = z.object({
  pageSize: z.enum(["A4", "Letter"]).default("A4"),
  orientation: z.enum(["portrait", "landscape"]).default("portrait"),
  margins: z
    .object({
      top: z.number().default(40),
      right: z.number().default(40),
      bottom: z.number().default(40),
      left: z.number().default(40),
    })
    .default({ top: 40, right: 40, bottom: 40, left: 40 }),
  headerStyle: z
    .enum(["logo-left", "logo-right", "logo-center", "logo-top-banner"])
    .default("logo-left"),
});

const brandingSchema = z.object({
  logoUrl: z.string().optional(),
  showLogo: z.boolean().default(true),
  primaryColor: hexColor.default("#2563EB"),
  secondaryColor: hexColor.default("#1E293B"),
  accentColor: hexColor.default("#0EA5E9"),
  backgroundColor: hexColor.default("#FFFFFF"),
  textColor: hexColor.default("#111111"),
});

const typographySchema = z.object({
  fontFamily: z
    .enum(["Inter", "Roboto", "Lato", "Merriweather", "Poppins", "Custom"])
    .default("Inter"),
  customFontUrl: z.string().optional(),
  baseFontSize: z.number().min(6).max(40).default(11),
  headingFontSize: z.number().min(8).max(60).default(22),
});

const itemColumnSchema = z.object({
  key: z.enum(["description", "quantity", "unitPrice", "taxRate", "discount", "amount"]),
  label: z.string(),
  visible: z.boolean().default(true),
  width: z.string().default("auto"),
});

const sectionsSchema = z.object({
  companyInfo: z.object({
    visible: z.boolean().default(true),
    order: z.number().default(1),
    fields: z.array(z.string()).default(["name", "address", "email", "phone", "taxId", "website"]),
  }),
  clientInfo: z.object({
    visible: z.boolean().default(true),
    order: z.number().default(2),
    label: z.string().default("Bill To"),
  }),
  invoiceMeta: z.object({
    visible: z.boolean().default(true),
    order: z.number().default(3),
    fields: z.array(z.string()).default(["invoiceNumber", "issueDate", "dueDate", "poNumber"]),
  }),
  itemsTable: z.object({
    visible: z.boolean().default(true),
    order: z.number().default(4),
    columns: z.array(itemColumnSchema).default([]),
    zebraStripes: z.boolean().default(false),
    headerBackgroundColor: hexColor.default("#F1F5F9"),
  }),
  summary: z.object({
    visible: z.boolean().default(true),
    order: z.number().default(5),
    fields: z.array(z.string()).default(["subTotal", "discount", "tax", "shipping", "grandTotal"]),
  }),
  notes: z.object({
    visible: z.boolean().default(true),
    order: z.number().default(6),
    label: z.string().default("Notes"),
  }),
  terms: z.object({
    visible: z.boolean().default(true),
    order: z.number().default(7),
    label: z.string().default("Terms & Conditions"),
  }),
  paymentInstructions: z.object({
    visible: z.boolean().default(false),
    order: z.number().default(8),
    content: z.string().default(""),
  }),
  signature: z.object({
    visible: z.boolean().default(false),
    order: z.number().default(9),
    signatureImageUrl: z.string().optional(),
    signatoryName: z.string().optional(),
    signatoryTitle: z.string().optional(),
  }),
  footer: z.object({
    visible: z.boolean().default(true),
    order: z.number().default(10),
    content: z.string().default("Thank you for your business"),
  }),
});

export const invoiceDesignSchema = z.object({
  layout: layoutSchema,
  branding: brandingSchema,
  typography: typographySchema,
  sections: sectionsSchema,
  watermark: z
    .object({
      enabled: z.boolean().default(false),
      text: z.string().default(""),
      opacity: z.number().min(0).max(1).default(0.1),
    })
    .default({ enabled: false, text: "", opacity: 0.1 }),
});

export const createTemplateSchema = z.object({
  name: z.string().trim().min(1, "Template name is required"),
  baseTheme: z.nativeEnum(BaseTheme).optional(),
  isDefault: z.boolean().optional(),
  design: invoiceDesignSchema,
});

export const updateTemplateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  baseTheme: z.nativeEnum(BaseTheme).optional(),
  design: invoiceDesignSchema.optional(),
});

export const previewTemplateSchema = z.object({
  design: invoiceDesignSchema,
});

export const cloneTemplateSchema = z.object({
  name: z.string().trim().min(1).optional(),
});
