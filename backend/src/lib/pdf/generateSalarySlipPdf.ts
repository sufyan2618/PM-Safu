import PDFDocument from "pdfkit";
import type { SalarySlipRenderData } from "./renderData";
import { formatCurrency } from "../../utils/format";

function streamToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

const ACCENT = "#0E7C5A";
const INK = "#0E1320";
const MUTED = "#6B7280";
const LINE = "#C9D0D8";
const SOFT = "#F1F4F8";
const HEAD = "#0F172A";

function titleCase(value?: string): string {
  if (!value) return "-";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateSalarySlipPdf(data: SalarySlipRenderData): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margins: { top: 36, right: 40, bottom: 40, left: 40 } });
  const bufferPromise = streamToBuffer(doc);

  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const width = right - left;
  const money = (n: number) => formatCurrency(n, data.currency);

  // ---- Small drawing helpers -------------------------------------------------
  const box = (x: number, y: number, w: number, h: number, fill?: string) => {
    if (fill) doc.rect(x, y, w, h).fill(fill);
    doc.lineWidth(0.8).strokeColor(LINE).rect(x, y, w, h).stroke();
  };

  const labelValue = (
    x: number,
    y: number,
    w: number,
    label: string,
    value: string,
    labelW = 96,
  ) => {
    doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(label, x + 8, y, { width: labelW });
    doc.fillColor(MUTED).text(":", x + 8 + labelW, y);
    doc
      .font("Helvetica-Bold")
      .fillColor(INK)
      .text(value || "-", x + 8 + labelW + 10, y, {
        width: w - labelW - 26,
        ellipsis: true,
        lineBreak: false,
      });
  };

  let y = doc.page.margins.top;

  // ===== HEADER ==============================================================
  const headerH = 86;
  box(left, y, width, headerH);

  const badge = 52;
  const bx = left + 14;
  const by = y + (headerH - badge) / 2;
  doc.roundedRect(bx, by, badge, badge, 8).fill(ACCENT);
  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(24)
    .text((data.companyName || "C").charAt(0).toUpperCase(), bx, by + 14, {
      width: badge,
      align: "center",
    });

  const tx = bx + badge + 16;
  const tw = right - tx - 14;
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(16).text(data.companyName, tx, y + 14, {
    width: tw,
    ellipsis: true,
    lineBreak: false,
  });
  doc.font("Helvetica").fontSize(8.5).fillColor(MUTED);
  let ay = y + 34;
  for (const line of data.companyAddressLines.slice(0, 2)) {
    doc.text(line, tx, ay, { width: tw, ellipsis: true, lineBreak: false });
    ay += 12;
  }
  const contact = [data.companyPhone, data.companyEmail].filter(Boolean).join("  ·  ");
  if (contact) {
    doc.text(contact, tx, ay, { width: tw, ellipsis: true, lineBreak: false });
  }
  y += headerH;

  // ===== PAYSLIP TITLE BAND ==================================================
  const titleH = 26;
  box(left, y, width, titleH, SOFT);
  doc
    .fillColor(INK)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(`PAYSLIP FOR ${data.period.toUpperCase()}`, left, y + 8, { width, align: "center" });
  y += titleH;

  // ===== EMPLOYEE DETAILS ====================================================
  const rows = 5;
  const rowH = 19;
  const detailH = rows * rowH + 12;
  const colW = width / 2;
  box(left, y, colW, detailH);
  box(left + colW, y, colW, detailH);

  const leftRows: [string, string][] = [
    ["Employee ID", data.employeeCode],
    ["Employee Name", data.employeeName],
    ["Designation", data.designation],
    ["Department", data.department ?? "-"],
    ["Date of Joining", data.dateOfJoining ?? "-"],
  ];
  const rightRows: [string, string][] = [
    ["Employment", titleCase(data.employmentType)],
    ["Email", data.email ?? "-"],
    ["Phone", data.phone ?? "-"],
    ["Bank", data.bankName ?? "-"],
    ["Account No.", data.accountNumber ?? "-"],
  ];

  leftRows.forEach(([label, value], i) => {
    labelValue(left, y + 8 + i * rowH, colW, label, value, 86);
  });
  rightRows.forEach(([label, value], i) => {
    labelValue(left + colW, y + 8 + i * rowH, colW, label, value, 78);
  });
  y += detailH;

  // ===== SUMMARY GRID ========================================================
  const lop = Math.max(0, data.workingDays - data.presentDays);
  const summary: [string, string][] = [
    ["Gross Wages", money(data.grossSalary)],
    ["Total Working Days", String(data.workingDays)],
    ["Paid Days", String(data.presentDays)],
    ["LOP Days", String(lop)],
    ["Payment Status", titleCase(data.paymentStatus)],
    ["Pay Date", data.paidOn ?? "-"],
  ];
  const sCols = 3;
  const sCellW = width / sCols;
  const sCellH = 38;
  summary.forEach(([label, value], i) => {
    const cx = left + (i % sCols) * sCellW;
    const cy = y + Math.floor(i / sCols) * sCellH;
    box(cx, cy, sCellW, sCellH);
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(MUTED)
      .text(label.toUpperCase(), cx + 8, cy + 7, { width: sCellW - 16 });
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(INK)
      .text(value, cx + 8, cy + 19, { width: sCellW - 16, ellipsis: true, lineBreak: false });
  });
  y += sCellH * 2;

  // ===== EARNINGS / DEDUCTIONS ==============================================
  const earnings = [{ name: "Basic", amount: data.baseSalary }, ...data.allowances];
  const deductions = data.deductions;
  const lineCount = Math.max(earnings.length, deductions.length, 1);
  const tHeadH = 22;
  const tRowH = 20;
  const tFootH = 24;

  // Header band
  box(left, y, colW, tHeadH, HEAD);
  box(left + colW, y, colW, tHeadH, HEAD);
  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("EARNINGS", left, y + 7, { width: colW, align: "center" });
  doc.text("DEDUCTIONS", left + colW, y + 7, { width: colW, align: "center" });
  y += tHeadH;

  const drawLineRow = (x: number, ry: number, item?: { name: string; amount: number }) => {
    box(x, ry, colW, tRowH);
    if (!item) return;
    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor(INK)
      .text(item.name, x + 8, ry + 6, { width: colW - 110, ellipsis: true, lineBreak: false });
    doc
      .font("Helvetica")
      .fillColor(INK)
      .text(money(item.amount), x + colW - 102, ry + 6, { width: 94, align: "right" });
  };

  for (let i = 0; i < lineCount; i++) {
    const ry = y + i * tRowH;
    drawLineRow(left, ry, earnings[i]);
    drawLineRow(left + colW, ry, deductions[i]);
  }
  y += lineCount * tRowH;

  // Totals footer
  box(left, y, colW, tFootH, SOFT);
  box(left + colW, y, colW, tFootH, SOFT);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(INK);
  doc.text("Total Earnings", left + 8, y + 7, { width: colW - 110 });
  doc.text(money(data.grossSalary), left + colW - 102, y + 7, { width: 94, align: "right" });
  doc.text("Total Deductions", left + colW + 8, y + 7, { width: colW - 110 });
  doc.text(money(data.totalDeductions), left + colW + colW - 102, y + 7, {
    width: 94,
    align: "right",
  });
  y += tFootH;

  // ===== NET SALARY ==========================================================
  const netH = 34;
  doc.rect(left, y, width, netH).fill(ACCENT);
  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(12)
    .text("NET SALARY (Take Home)", left + 12, y + 10);
  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(15)
    .text(money(data.netSalary), right - 212, y + 8, { width: 200, align: "right" });
  y += netH;

  // ===== FOOTER NOTE =========================================================
  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(MUTED)
    .text(
      "This is a system-generated payslip and does not require a signature.",
      left,
      y + 12,
      { width, align: "center" },
    );
  doc.text(`Generated on ${new Date().toLocaleDateString("en-GB")}`, left, y + 23, {
    width,
    align: "center",
  });

  doc.end();
  return bufferPromise;
}
