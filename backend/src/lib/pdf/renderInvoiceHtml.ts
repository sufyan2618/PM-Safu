import type { InvoiceDesign, ItemColumn } from "../../types/invoiceTemplate.types";
import type { InvoicePartyInfo, InvoiceRenderData, InvoiceRenderItem } from "./renderData";
import { escapeHtml, formatCurrency } from "../../utils/format";

const COLUMN_VALUE: Record<
  ItemColumn["key"],
  (item: InvoiceRenderItem, currency: string) => string
> = {
  description: (item) => escapeHtml(item.description),
  quantity: (item) => String(item.quantity),
  unitPrice: (item, currency) => formatCurrency(item.unitPrice, currency),
  taxRate: (item) => `${item.taxRate}%`,
  discount: (item) => String(item.discount),
  amount: (item, currency) => formatCurrency(item.amount, currency),
};

function partyBlock(party: InvoicePartyInfo, fields: string[]): string {
  const lines: string[] = [];
  if (fields.includes("name")) lines.push(`<strong>${escapeHtml(party.name)}</strong>`);
  if (fields.includes("address")) lines.push(...party.addressLines.map(escapeHtml));
  if (fields.includes("email") && party.email) lines.push(escapeHtml(party.email));
  if (fields.includes("phone") && party.phone) lines.push(escapeHtml(party.phone));
  if (fields.includes("website") && party.website) lines.push(escapeHtml(party.website));
  if (fields.includes("taxId") && party.taxId) lines.push(`Tax ID: ${escapeHtml(party.taxId)}`);
  return lines.join("<br/>");
}

/** Renders a full HTML document for an invoice, honoring the saved design JSON. */
export function renderInvoiceHtml(data: InvoiceRenderData): string {
  const { design, company, client, meta, items, totals, currency } = data;
  const { branding, typography, layout, sections } = design;

  const orderedSections = Object.entries(sections)
    .filter(([, value]) => value.visible)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([key]) => key);

  const visibleColumns = sections.itemsTable.columns.filter((column) => column.visible);

  const renderSection = (key: string): string => {
    switch (key) {
      case "companyInfo":
        return `<div class="party">${partyBlock(company, sections.companyInfo.fields)}</div>`;
      case "clientInfo":
        return `<div class="party"><div class="label">${escapeHtml(sections.clientInfo.label)}</div>${partyBlock(client, ["name", "address", "email", "phone", "taxId"])}</div>`;
      case "invoiceMeta": {
        const rows: string[] = [];
        const f = sections.invoiceMeta.fields;
        if (f.includes("invoiceNumber")) rows.push(`<tr><td>Invoice #</td><td>${escapeHtml(meta.invoiceNumber)}</td></tr>`);
        if (f.includes("issueDate")) rows.push(`<tr><td>Issue Date</td><td>${escapeHtml(meta.issueDate)}</td></tr>`);
        if (f.includes("dueDate")) rows.push(`<tr><td>Due Date</td><td>${escapeHtml(meta.dueDate)}</td></tr>`);
        if (f.includes("poNumber") && meta.poNumber) rows.push(`<tr><td>PO #</td><td>${escapeHtml(meta.poNumber)}</td></tr>`);
        return `<table class="meta">${rows.join("")}</table>`;
      }
      case "itemsTable": {
        const head = visibleColumns
          .map((column) => `<th style="width:${column.width};">${escapeHtml(column.label)}</th>`)
          .join("");
        const body = items
          .map((item, index) => {
            const cells = visibleColumns
              .map((column) => `<td>${COLUMN_VALUE[column.key](item, currency)}</td>`)
              .join("");
            const stripe = sections.itemsTable.zebraStripes && index % 2 === 1 ? ' class="stripe"' : "";
            return `<tr${stripe}>${cells}</tr>`;
          })
          .join("");
        return `<table class="items"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
      }
      case "summary": {
        const f = sections.summary.fields;
        const rows: string[] = [];
        if (f.includes("subTotal")) rows.push(`<tr><td>Subtotal</td><td>${formatCurrency(totals.subTotal, currency)}</td></tr>`);
        if (f.includes("discount")) rows.push(`<tr><td>Discount</td><td>-${formatCurrency(totals.totalDiscount, currency)}</td></tr>`);
        if (f.includes("tax")) rows.push(`<tr><td>Tax</td><td>${formatCurrency(totals.totalTax, currency)}</td></tr>`);
        if (f.includes("shipping")) rows.push(`<tr><td>Shipping</td><td>${formatCurrency(totals.shippingFee, currency)}</td></tr>`);
        if (f.includes("grandTotal")) rows.push(`<tr class="grand"><td>Total</td><td>${formatCurrency(totals.grandTotal, currency)}</td></tr>`);
        if (totals.amountPaid > 0) rows.push(`<tr><td>Paid</td><td>-${formatCurrency(totals.amountPaid, currency)}</td></tr>`);
        rows.push(`<tr class="due"><td>Amount Due</td><td>${formatCurrency(totals.amountDue, currency)}</td></tr>`);
        return `<table class="summary">${rows.join("")}</table>`;
      }
      case "notes":
        return data.notes
          ? `<div class="block"><div class="label">${escapeHtml(sections.notes.label)}</div><p>${escapeHtml(data.notes)}</p></div>`
          : "";
      case "terms":
        return data.termsAndConditions
          ? `<div class="block"><div class="label">${escapeHtml(sections.terms.label)}</div><p>${escapeHtml(data.termsAndConditions)}</p></div>`
          : "";
      case "paymentInstructions":
        return sections.paymentInstructions.content
          ? `<div class="block"><div class="label">Payment Instructions</div><p>${escapeHtml(sections.paymentInstructions.content)}</p></div>`
          : "";
      case "signature":
        return `<div class="signature">${sections.signature.signatureImageUrl ? `<img src="${sections.signature.signatureImageUrl}" alt="signature" height="48"/><br/>` : ""}<div class="sigline">${escapeHtml(sections.signature.signatoryName ?? "")}</div><div class="sigtitle">${escapeHtml(sections.signature.signatoryTitle ?? "")}</div></div>`;
      case "footer":
        return `<div class="footer">${escapeHtml(sections.footer.content)}</div>`;
      default:
        return "";
    }
  };

  const logo =
    branding.showLogo && branding.logoUrl
      ? `<img class="logo" src="${branding.logoUrl}" alt="logo"/>`
      : `<div class="logo-text">${escapeHtml(company.name)}</div>`;

  const watermark = design.watermark.enabled
    ? `<div class="watermark" style="opacity:${design.watermark.opacity};">${escapeHtml(design.watermark.text)}</div>`
    : "";

  const headerAlign =
    layout.headerStyle === "logo-right" ? "flex-end" : layout.headerStyle === "logo-center" ? "center" : "flex-start";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: ${typography.fontFamily === "Custom" ? "sans-serif" : typography.fontFamily}, Arial, sans-serif;
    font-size: ${typography.baseFontSize}pt;
    color: ${branding.textColor};
    background: ${branding.backgroundColor};
    margin: 0;
    padding: ${layout.margins.top}px ${layout.margins.right}px ${layout.margins.bottom}px ${layout.margins.left}px;
    position: relative;
  }
  .header { display:flex; justify-content:${headerAlign}; align-items:center; border-bottom:3px solid ${branding.primaryColor}; padding-bottom:16px; margin-bottom:24px; }
  .logo { max-height:64px; }
  .logo-text { font-size:${typography.headingFontSize}pt; font-weight:700; color:${branding.primaryColor}; }
  h1.title { color:${branding.primaryColor}; font-size:${typography.headingFontSize}pt; margin:0 0 16px; }
  .top-grid { display:flex; justify-content:space-between; gap:24px; margin-bottom:24px; }
  .party .label { font-weight:600; color:${branding.secondaryColor}; margin-bottom:4px; text-transform:uppercase; font-size:9pt; letter-spacing:.5px; }
  table { width:100%; border-collapse:collapse; }
  table.meta td { padding:2px 8px 2px 0; }
  table.meta td:first-child { color:${branding.secondaryColor}; font-weight:600; }
  table.items { margin:16px 0; }
  table.items th { background:${sections.itemsTable.headerBackgroundColor}; color:${branding.secondaryColor}; text-align:left; padding:8px; border-bottom:2px solid ${branding.primaryColor}; font-size:9pt; text-transform:uppercase; }
  table.items td { padding:8px; border-bottom:1px solid #e5e7eb; }
  table.items tr.stripe td { background:#f9fafb; }
  table.summary { width:280px; margin-left:auto; margin-top:8px; }
  table.summary td { padding:4px 8px; }
  table.summary td:last-child { text-align:right; }
  table.summary tr.grand td { font-weight:700; border-top:2px solid ${branding.primaryColor}; font-size:${typography.baseFontSize + 1}pt; }
  table.summary tr.due td { font-weight:700; color:${branding.accentColor}; }
  .block { margin-top:16px; }
  .block .label { font-weight:600; color:${branding.secondaryColor}; margin-bottom:4px; }
  .signature { margin-top:40px; }
  .sigline { border-top:1px solid ${branding.textColor}; width:200px; padding-top:4px; font-weight:600; }
  .sigtitle { color:${branding.secondaryColor}; font-size:9pt; }
  .footer { margin-top:32px; text-align:center; color:${branding.secondaryColor}; border-top:1px solid #e5e7eb; padding-top:12px; }
  .watermark { position:fixed; top:45%; left:50%; transform:translate(-50%,-50%) rotate(-30deg); font-size:80pt; font-weight:800; color:${branding.primaryColor}; pointer-events:none; z-index:0; }
  .content { position:relative; z-index:1; }
</style>
</head>
<body>
  ${watermark}
  <div class="content">
    <div class="header">${logo}</div>
    <h1 class="title">INVOICE</h1>
    <div class="top-grid">
      <div>${orderedSections.includes("companyInfo") ? renderSection("companyInfo") : ""}${orderedSections.includes("clientInfo") ? renderSection("clientInfo") : ""}</div>
      <div>${orderedSections.includes("invoiceMeta") ? renderSection("invoiceMeta") : ""}</div>
    </div>
    ${orderedSections
      .filter((key) => !["companyInfo", "clientInfo", "invoiceMeta"].includes(key))
      .map((key) => renderSection(key))
      .join("\n")}
  </div>
</body>
</html>`;
}
