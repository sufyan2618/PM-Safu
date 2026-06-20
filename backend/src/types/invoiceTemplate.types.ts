export type PageSize = "A4" | "Letter";
export type Orientation = "portrait" | "landscape";
export type HeaderStyle = "logo-left" | "logo-right" | "logo-center" | "logo-top-banner";
export type FontFamily = "Inter" | "Roboto" | "Lato" | "Merriweather" | "Poppins" | "Custom";
export type ItemColumnKey =
  | "description"
  | "quantity"
  | "unitPrice"
  | "taxRate"
  | "discount"
  | "amount";

export interface InvoiceDesignLayout {
  pageSize: PageSize;
  orientation: Orientation;
  margins: { top: number; right: number; bottom: number; left: number };
  headerStyle: HeaderStyle;
}

export interface InvoiceDesignBranding {
  logoUrl?: string;
  showLogo: boolean;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}

export interface InvoiceDesignTypography {
  fontFamily: FontFamily;
  customFontUrl?: string;
  baseFontSize: number;
  headingFontSize: number;
}

export interface ItemColumn {
  key: ItemColumnKey;
  label: string;
  visible: boolean;
  width: string;
}

export interface InvoiceDesignSections {
  companyInfo: { visible: boolean; order: number; fields: string[] };
  clientInfo: { visible: boolean; order: number; label: string };
  invoiceMeta: { visible: boolean; order: number; fields: string[] };
  itemsTable: {
    visible: boolean;
    order: number;
    columns: ItemColumn[];
    zebraStripes: boolean;
    headerBackgroundColor: string;
  };
  summary: { visible: boolean; order: number; fields: string[] };
  notes: { visible: boolean; order: number; label: string };
  terms: { visible: boolean; order: number; label: string };
  paymentInstructions: { visible: boolean; order: number; content: string };
  signature: {
    visible: boolean;
    order: number;
    signatureImageUrl?: string;
    signatoryName?: string;
    signatoryTitle?: string;
  };
  footer: { visible: boolean; order: number; content: string };
}

export interface InvoiceDesign {
  layout: InvoiceDesignLayout;
  branding: InvoiceDesignBranding;
  typography: InvoiceDesignTypography;
  sections: InvoiceDesignSections;
  watermark: { enabled: boolean; text: string; opacity: number };
}
