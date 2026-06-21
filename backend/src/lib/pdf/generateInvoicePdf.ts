import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import type { InvoiceRenderData } from "./renderData";
import { formatCurrency } from "../../utils/format";
import { env } from "../../config/env";

function streamToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

/** Generates an invoice PDF buffer using pdfkit, honoring the design's colors. */
export async function generateInvoicePdf(data: InvoiceRenderData): Promise<Buffer> {
  const { design, company, client, meta, items, totals, currency } = data;
  const { branding } = design;

  const doc = new PDFDocument({
    size: design.layout.pageSize,
    layout: design.layout.orientation,
    margins: design.layout.margins,
  });
  const bufferPromise = streamToBuffer(doc);

  const primary = branding.primaryColor;
  const secondary = branding.secondaryColor;
  const text = branding.textColor;

  // Header
  doc.fillColor(primary).fontSize(24).font("Helvetica-Bold").text(company.name, { continued: false });
  doc.moveDown(0.2);
  doc.fillColor(text).fontSize(9).font("Helvetica");
  for (const line of company.addressLines) doc.text(line);
  if (company.email) doc.text(company.email);
  if (company.phone) doc.text(company.phone);
  if (company.taxId) doc.text(`Tax ID: ${company.taxId}`);

  doc.moveDown(1);
  doc.fillColor(primary).fontSize(20).font("Helvetica-Bold").text("INVOICE", { align: "right" });
  doc.fillColor(text).fontSize(10).font("Helvetica");
  doc.text(`Invoice #: ${meta.invoiceNumber}`, { align: "right" });
  doc.text(`Issue Date: ${meta.issueDate}`, { align: "right" });
  doc.text(`Due Date: ${meta.dueDate}`, { align: "right" });
  if (meta.poNumber) doc.text(`PO #: ${meta.poNumber}`, { align: "right" });

  // Bill To
  doc.moveDown(1.5);
  doc.fillColor(secondary).fontSize(10).font("Helvetica-Bold").text(design.sections.clientInfo.label.toUpperCase());
  doc.fillColor(text).fontSize(10).font("Helvetica").text(client.name);
  for (const line of client.addressLines) doc.text(line);
  if (client.email) doc.text(client.email);
  if (client.taxId) doc.text(`Tax ID: ${client.taxId}`);

  // Items table
  doc.moveDown(1.5);
  const tableTop = doc.y;
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const tableWidth = right - left;
  const colDescW = tableWidth * 0.46;
  const colQtyW = tableWidth * 0.12;
  const colPriceW = tableWidth * 0.18;
  const colAmtW = tableWidth * 0.24;

  doc.rect(left, tableTop, tableWidth, 22).fill(primary);
  doc.fillColor("#FFFFFF").fontSize(9).font("Helvetica-Bold");
  doc.text("DESCRIPTION", left + 6, tableTop + 6, { width: colDescW - 6 });
  doc.text("QTY", left + colDescW, tableTop + 6, { width: colQtyW, align: "right" });
  doc.text("UNIT PRICE", left + colDescW + colQtyW, tableTop + 6, { width: colPriceW, align: "right" });
  doc.text("AMOUNT", left + colDescW + colQtyW + colPriceW, tableTop + 6, { width: colAmtW - 6, align: "right" });

  let y = tableTop + 22;
  doc.font("Helvetica").fontSize(9).fillColor(text);
  for (const [index, item] of items.entries()) {
    const rowHeight = 20;
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
    }
    if (design.sections.itemsTable.zebraStripes && index % 2 === 1) {
      doc.rect(left, y, tableWidth, rowHeight).fill("#F9FAFB");
      doc.fillColor(text);
    }
    doc.text(item.description, left + 6, y + 5, { width: colDescW - 6 });
    doc.text(String(item.quantity), left + colDescW, y + 5, { width: colQtyW, align: "right" });
    doc.text(formatCurrency(item.unitPrice, currency), left + colDescW + colQtyW, y + 5, {
      width: colPriceW,
      align: "right",
    });
    doc.text(formatCurrency(item.amount, currency), left + colDescW + colQtyW + colPriceW, y + 5, {
      width: colAmtW - 6,
      align: "right",
    });
    y += rowHeight;
    doc.moveTo(left, y).lineTo(right, y).strokeColor("#E5E7EB").stroke();
  }

  // Summary
  y += 12;
  const summaryX = right - 240;
  const summaryRow = (label: string, value: string, bold = false, color = text) => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 11 : 10).fillColor(color);
    doc.text(label, summaryX, y, { width: 140 });
    doc.text(value, summaryX + 140, y, { width: 100, align: "right" });
    y += bold ? 20 : 16;
  };
  summaryRow("Subtotal", formatCurrency(totals.subTotal, currency));
  if (totals.totalDiscount > 0) summaryRow("Discount", `-${formatCurrency(totals.totalDiscount, currency)}`);
  const taxBreakdown = totals.taxBreakdown ?? [];
  if (taxBreakdown.length > 0) {
    for (const entry of taxBreakdown) {
      summaryRow(`Tax (${entry.rate}%)`, formatCurrency(entry.taxAmount, currency));
    }
  } else if (totals.totalTax > 0) {
    summaryRow("Tax", formatCurrency(totals.totalTax, currency));
  }
  if (totals.shippingFee > 0) summaryRow("Shipping", formatCurrency(totals.shippingFee, currency));
  summaryRow("Total", formatCurrency(totals.grandTotal, currency), true, primary);
  if (totals.amountPaid > 0) summaryRow("Paid", `-${formatCurrency(totals.amountPaid, currency)}`);
  summaryRow("Amount Due", formatCurrency(totals.amountDue, currency), true, branding.accentColor);

  // Notes & terms
  if (data.notes && design.sections.notes.visible) {
    doc.moveDown(1);
    doc.fillColor(secondary).font("Helvetica-Bold").fontSize(10).text(design.sections.notes.label, left);
    doc.fillColor(text).font("Helvetica").fontSize(9).text(data.notes, left, doc.y, { width: tableWidth });
  }
  if (data.termsAndConditions && design.sections.terms.visible) {
    doc.moveDown(0.5);
    doc.fillColor(secondary).font("Helvetica-Bold").fontSize(10).text(design.sections.terms.label, left);
    doc.fillColor(text).font("Helvetica").fontSize(9).text(data.termsAndConditions, left, doc.y, { width: tableWidth });
  }

  // QR code — embed in bottom-right corner when a share token is available.
  if (data.shareToken) {
    const shareUrl = `${env.CLIENT_BASE_URL}/invoice/share/${data.shareToken}`;
    const qrSize = 70;
    const qrX = right - qrSize;
    const qrY = doc.page.height - doc.page.margins.bottom - qrSize - 16;

    try {
      const qrBuffer = await QRCode.toBuffer(shareUrl, { type: "png", width: qrSize, margin: 1 });
      doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
      doc
        .fillColor(secondary)
        .fontSize(7)
        .font("Helvetica")
        .text("Scan to view online", qrX, qrY + qrSize + 2, { width: qrSize, align: "center" });
    } catch {
      // QR generation failure is non-fatal — skip silently.
    }
  }

  if (design.sections.footer.visible) {
    const footerWidth = data.shareToken ? tableWidth - 90 : tableWidth;
    doc.fillColor(secondary).fontSize(9).font("Helvetica").text(
      design.sections.footer.content,
      left,
      doc.page.height - doc.page.margins.bottom - 20,
      { width: footerWidth, align: "center" },
    );
  }

  doc.end();
  return bufferPromise;
}
