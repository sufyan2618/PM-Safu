import { BaseTheme } from "../config/constants";
import type { InvoiceDesign, ItemColumn } from "../types/invoiceTemplate.types";

function defaultColumns(): ItemColumn[] {
  return [
    { key: "description", label: "Description", visible: true, width: "40%" },
    { key: "quantity", label: "Qty", visible: true, width: "12%" },
    { key: "unitPrice", label: "Unit Price", visible: true, width: "16%" },
    { key: "taxRate", label: "Tax %", visible: true, width: "12%" },
    { key: "discount", label: "Disc.", visible: true, width: "10%" },
    { key: "amount", label: "Amount", visible: true, width: "20%" },
  ];
}

interface PresetOptions {
  brandColor?: string;
  logoUrl?: string;
}

export function buildInvoiceDesign(theme: BaseTheme, options: PresetOptions = {}): InvoiceDesign {
  const primary = options.brandColor || "#2563EB";

  const palettes: Record<string, { primary: string; secondary: string; accent: string; header: string }> = {
    [BaseTheme.CLASSIC]: { primary, secondary: "#1E293B", accent: "#0EA5E9", header: "#F1F5F9" },
    [BaseTheme.MODERN]: { primary, secondary: "#0F172A", accent: "#6366F1", header: "#EEF2FF" },
    [BaseTheme.MINIMAL]: { primary: "#111827", secondary: "#374151", accent: primary, header: "#FFFFFF" },
    [BaseTheme.BOLD]: { primary, secondary: "#111827", accent: "#F97316", header: primary },
    [BaseTheme.CUSTOM]: { primary, secondary: "#1E293B", accent: "#0EA5E9", header: "#F1F5F9" },
  };

  const palette = palettes[theme] ?? palettes[BaseTheme.CLASSIC]!;

  const fontByTheme: Record<string, InvoiceDesign["typography"]["fontFamily"]> = {
    [BaseTheme.CLASSIC]: "Merriweather",
    [BaseTheme.MODERN]: "Poppins",
    [BaseTheme.MINIMAL]: "Inter",
    [BaseTheme.BOLD]: "Lato",
    [BaseTheme.CUSTOM]: "Inter",
  };

  return {
    layout: {
      pageSize: "A4",
      orientation: "portrait",
      margins: { top: 40, right: 40, bottom: 40, left: 40 },
      headerStyle: theme === BaseTheme.MODERN ? "logo-top-banner" : "logo-left",
    },
    branding: {
      logoUrl: options.logoUrl,
      showLogo: true,
      primaryColor: palette.primary,
      secondaryColor: palette.secondary,
      accentColor: palette.accent,
      backgroundColor: "#FFFFFF",
      textColor: "#111111",
    },
    typography: {
      fontFamily: fontByTheme[theme] ?? "Inter",
      baseFontSize: 11,
      headingFontSize: 22,
    },
    sections: {
      companyInfo: {
        visible: true,
        order: 1,
        fields: ["name", "address", "email", "phone", "taxId", "website"],
      },
      clientInfo: { visible: true, order: 2, label: "Bill To" },
      invoiceMeta: {
        visible: true,
        order: 3,
        fields: ["invoiceNumber", "issueDate", "dueDate", "poNumber"],
      },
      itemsTable: {
        visible: true,
        order: 4,
        columns: defaultColumns(),
        zebraStripes: theme !== BaseTheme.MINIMAL,
        headerBackgroundColor: palette.header,
      },
      summary: {
        visible: true,
        order: 5,
        fields: ["subTotal", "discount", "tax", "shipping", "grandTotal"],
      },
      notes: { visible: true, order: 6, label: "Notes" },
      terms: { visible: true, order: 7, label: "Terms & Conditions" },
      paymentInstructions: { visible: false, order: 8, content: "" },
      signature: { visible: false, order: 9 },
      footer: { visible: true, order: 10, content: "Thank you for your business" },
    },
    watermark: { enabled: false, text: "", opacity: 0.1 },
  };
}

export function defaultPresets(options: PresetOptions = {}) {
  return [
    { name: "Classic", baseTheme: BaseTheme.CLASSIC, design: buildInvoiceDesign(BaseTheme.CLASSIC, options), isDefault: true },
    { name: "Modern", baseTheme: BaseTheme.MODERN, design: buildInvoiceDesign(BaseTheme.MODERN, options), isDefault: false },
    { name: "Minimal", baseTheme: BaseTheme.MINIMAL, design: buildInvoiceDesign(BaseTheme.MINIMAL, options), isDefault: false },
    { name: "Bold", baseTheme: BaseTheme.BOLD, design: buildInvoiceDesign(BaseTheme.BOLD, options), isDefault: false },
  ];
}
