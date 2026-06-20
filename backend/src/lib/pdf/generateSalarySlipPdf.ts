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

const PRIMARY = "#2563EB";
const SECONDARY = "#1E293B";
const TEXT = "#111827";

export async function generateSalarySlipPdf(data: SalarySlipRenderData): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margins: { top: 40, right: 40, bottom: 40, left: 40 } });
  const bufferPromise = streamToBuffer(doc);

  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const width = right - left;

  doc.fillColor(PRIMARY).fontSize(20).font("Helvetica-Bold").text(data.companyName);
  doc.fillColor(SECONDARY).fontSize(13).font("Helvetica-Bold").text("Salary Slip", { align: "right" });
  doc.fillColor(TEXT).fontSize(10).font("Helvetica").text(`Pay Period: ${data.period}`, { align: "right" });
  doc.moveDown(1);
  doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor(PRIMARY).lineWidth(2).stroke();
  doc.moveDown(1);

  // Employee details
  const detailY = doc.y;
  doc.fillColor(SECONDARY).fontSize(9).font("Helvetica-Bold").text("EMPLOYEE", left, detailY);
  doc.fillColor(TEXT).fontSize(10).font("Helvetica");
  doc.text(data.employeeName, left, detailY + 14);
  doc.text(`Code: ${data.employeeCode}`, left, detailY + 28);
  doc.text(`Designation: ${data.designation}`, left, detailY + 42);
  if (data.department) doc.text(`Department: ${data.department}`, left, detailY + 56);

  doc.fillColor(SECONDARY).fontSize(9).font("Helvetica-Bold").text("ATTENDANCE", left + width / 2, detailY);
  doc.fillColor(TEXT).fontSize(10).font("Helvetica");
  doc.text(`Working Days: ${data.workingDays}`, left + width / 2, detailY + 14);
  doc.text(`Present Days: ${data.presentDays}`, left + width / 2, detailY + 28);
  doc.text(`Status: ${data.paymentStatus}`, left + width / 2, detailY + 42);

  doc.moveDown(5);

  // Earnings / Deductions tables side by side
  const colWidth = (width - 20) / 2;
  let earnY = doc.y;

  const drawTable = (
    x: number,
    title: string,
    rows: { name: string; amount: number }[],
    totalLabel: string,
    total: number,
  ) => {
    let yy = earnY;
    doc.rect(x, yy, colWidth, 20).fill(PRIMARY);
    doc.fillColor("#FFFFFF").fontSize(10).font("Helvetica-Bold").text(title, x + 8, yy + 5);
    yy += 20;
    doc.fillColor(TEXT).font("Helvetica").fontSize(9);
    for (const row of rows) {
      doc.text(row.name, x + 8, yy + 5, { width: colWidth - 100 });
      doc.text(formatCurrency(row.amount, data.currency), x + colWidth - 92, yy + 5, {
        width: 84,
        align: "right",
      });
      yy += 18;
      doc.moveTo(x, yy).lineTo(x + colWidth, yy).strokeColor("#E5E7EB").lineWidth(1).stroke();
    }
    doc.font("Helvetica-Bold").fillColor(SECONDARY);
    doc.text(totalLabel, x + 8, yy + 6, { width: colWidth - 100 });
    doc.text(formatCurrency(total, data.currency), x + colWidth - 92, yy + 6, { width: 84, align: "right" });
    return yy + 24;
  };

  const earnings = [{ name: "Basic Salary", amount: data.baseSalary }, ...data.allowances];
  const earnEnd = drawTable(left, "EARNINGS", earnings, "Gross Salary", data.grossSalary);
  const dedEnd = drawTable(
    left + colWidth + 20,
    "DEDUCTIONS",
    data.deductions,
    "Total Deductions",
    data.totalDeductions,
  );

  doc.y = Math.max(earnEnd, dedEnd) + 16;
  doc.rect(left, doc.y, width, 30).fill("#F1F5F9");
  doc.fillColor(SECONDARY).fontSize(12).font("Helvetica-Bold").text("NET SALARY", left + 12, doc.y + 9);
  doc.fillColor(PRIMARY).fontSize(13).text(formatCurrency(data.netSalary, data.currency), right - 200, doc.y + 9, {
    width: 188,
    align: "right",
  });

  doc.end();
  return bufferPromise;
}
