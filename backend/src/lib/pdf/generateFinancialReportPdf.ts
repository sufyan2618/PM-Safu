import PDFDocument from "pdfkit";
import { formatCurrency, monthName } from "../../utils/format";

export interface FinancialReportRenderData {
  companyName: string;
  currency: string;
  from: Date;
  to: Date;
  revenue: number;
  payrollExpense: number;
  net: number;
  outstanding: number;
  statusBreakdown: { _id: string; count: number; totalAmount: number; amountDue: number }[];
  revenueSeries: { _id: { year: number; month: number }; revenue: number; count: number }[];
}

function streamToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

const PRIMARY = "#2563EB";
const SECONDARY = "#1E293B";
const TEXT = "#111827";
const MUTED = "#6B7280";

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateFinancialReportPdf(data: FinancialReportRenderData): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margins: { top: 40, right: 40, bottom: 40, left: 40 } });
  const bufferPromise = streamToBuffer(doc);

  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const width = right - left;
  const fmt = (v: number) => formatCurrency(v, data.currency);
  const dateStr = (d: Date) =>
    new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(d);

  // Header
  doc.fillColor(PRIMARY).fontSize(20).font("Helvetica-Bold").text(data.companyName);
  doc.fillColor(SECONDARY).fontSize(13).font("Helvetica-Bold").text("Financial Report", { align: "right" });
  doc
    .fillColor(MUTED)
    .fontSize(10)
    .font("Helvetica")
    .text(`${dateStr(data.from)}  —  ${dateStr(data.to)}`, { align: "right" });
  doc.moveDown(1);
  doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor(PRIMARY).lineWidth(2).stroke();
  doc.moveDown(1);

  // KPI grid (2 x 2)
  const kpis = [
    { label: "Revenue", value: fmt(data.revenue) },
    { label: "Payroll Expense", value: fmt(data.payrollExpense) },
    { label: "Net", value: fmt(data.net) },
    { label: "Outstanding", value: fmt(data.outstanding) },
  ];
  const cardW = (width - 16) / 2;
  const cardH = 52;
  const gridTop = doc.y;
  kpis.forEach((kpi, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = left + col * (cardW + 16);
    const y = gridTop + row * (cardH + 12);
    doc.roundedRect(x, y, cardW, cardH, 6).fillAndStroke("#F8FAFC", "#E5E7EB");
    doc.fillColor(MUTED).fontSize(9).font("Helvetica-Bold").text(kpi.label.toUpperCase(), x + 12, y + 10);
    doc.fillColor(TEXT).fontSize(15).font("Helvetica-Bold").text(kpi.value, x + 12, y + 24);
  });
  doc.y = gridTop + 2 * cardH + 12 + 20;

  // Invoice status breakdown table
  doc.fillColor(SECONDARY).fontSize(12).font("Helvetica-Bold").text("Invoice Status Breakdown", left, doc.y);
  doc.moveDown(0.5);

  const tableTop = doc.y;
  const cStatus = { x: left, w: width * 0.34 };
  const cCount = { x: left + width * 0.34, w: width * 0.16 };
  const cTotal = { x: left + width * 0.5, w: width * 0.25 };
  const cDue = { x: left + width * 0.75, w: width * 0.25 };
  doc.rect(left, tableTop, width, 20).fill("#F1F5F9");
  doc.fillColor(SECONDARY).fontSize(9).font("Helvetica-Bold");
  doc.text("Status", cStatus.x + 8, tableTop + 6, { width: cStatus.w - 8 });
  doc.text("Count", cCount.x, tableTop + 6, { width: cCount.w - 8, align: "right" });
  doc.text("Total", cTotal.x, tableTop + 6, { width: cTotal.w - 8, align: "right" });
  doc.text("Due", cDue.x, tableTop + 6, { width: cDue.w - 8, align: "right" });

  let y = tableTop + 20;
  doc.font("Helvetica").fontSize(9).fillColor(TEXT);
  if (data.statusBreakdown.length === 0) {
    doc.fillColor(MUTED).text("No invoices in this period", left + 8, y + 6);
    y += 24;
  } else {
    for (const row of data.statusBreakdown) {
      doc.fillColor(TEXT).font("Helvetica");
      doc.text(formatStatus(row._id), cStatus.x + 8, y + 6, { width: cStatus.w - 8 });
      doc.text(String(row.count), cCount.x, y + 6, { width: cCount.w - 8, align: "right" });
      doc.text(fmt(row.totalAmount), cTotal.x, y + 6, { width: cTotal.w - 8, align: "right" });
      doc.text(fmt(row.amountDue), cDue.x, y + 6, { width: cDue.w - 8, align: "right" });
      y += 20;
      doc.moveTo(left, y).lineTo(right, y).strokeColor("#E5E7EB").lineWidth(1).stroke();
    }
  }

  doc.y = y + 20;

  // Monthly revenue table
  doc.fillColor(SECONDARY).fontSize(12).font("Helvetica-Bold").text("Monthly Revenue", left, doc.y);
  doc.moveDown(0.5);
  const rTop = doc.y;
  doc.rect(left, rTop, width, 20).fill("#F1F5F9");
  doc.fillColor(SECONDARY).fontSize(9).font("Helvetica-Bold");
  doc.text("Month", left + 8, rTop + 6, { width: width * 0.5 - 8 });
  doc.text("Invoices", left + width * 0.5, rTop + 6, { width: width * 0.2 - 8, align: "right" });
  doc.text("Revenue", left + width * 0.7, rTop + 6, { width: width * 0.3 - 8, align: "right" });

  let ry = rTop + 20;
  doc.font("Helvetica").fontSize(9).fillColor(TEXT);
  if (data.revenueSeries.length === 0) {
    doc.fillColor(MUTED).text("No revenue in this period", left + 8, ry + 6);
  } else {
    for (const point of data.revenueSeries) {
      doc.fillColor(TEXT).font("Helvetica");
      doc.text(`${monthName(point._id.month)} ${point._id.year}`, left + 8, ry + 6, {
        width: width * 0.5 - 8,
      });
      doc.text(String(point.count), left + width * 0.5, ry + 6, { width: width * 0.2 - 8, align: "right" });
      doc.text(fmt(point.revenue), left + width * 0.7, ry + 6, { width: width * 0.3 - 8, align: "right" });
      ry += 20;
      doc.moveTo(left, ry).lineTo(right, ry).strokeColor("#E5E7EB").lineWidth(1).stroke();
    }
  }

  doc.end();
  return bufferPromise;
}
