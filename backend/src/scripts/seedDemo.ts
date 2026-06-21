/**
 * Demo Seed Script
 *
 * Creates a fully-populated demo workspace so all charts, tables, and dashboards
 * render with realistic data out of the box.
 *
 * Run:
 *   bun src/scripts/seedDemo.ts           (uses .env)
 *   bun --env-file=.env src/scripts/seedDemo.ts
 *
 * Options (env vars):
 *   DEMO_EMAIL    – company-admin login email   (default: demo@pmsafu.com)
 *   DEMO_PASSWORD – password for all demo users (default: Demo@1234)
 *   DEMO_RESET    – set to "true" to wipe the demo company first
 *
 * What gets created:
 *  • 1 SuperAdmin (uses SUPERADMIN_SEED_EMAIL / SUPERADMIN_SEED_PASSWORD)
 *  • 1 Company (approved, onboarding complete) with invoice + payroll settings
 *  • 4 Invoice templates (Classic, Modern, Minimal, Bold)
 *  • 6 Departments
 *  • 5 Salary structures (tiered)
 *  • 12 Employees across departments
 *  • 5 Users (admin, HR, accountant, 2× staff) linked to employees
 *  • 8 Clients
 *  • ~130 Invoices spread over the last 12 months (draft/sent/paid/overdue/partial/cancelled)
 *  • 12 Payroll runs (one per month for the last 12 months, all completed)
 *  • Salary slips for every employee × every payroll run
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { randomBytes } from "node:crypto";

dotenv.config();

// ── Models ────────────────────────────────────────────────────────────────────
import { CompanyModel } from "../models/company.model";
import { SuperAdminModel } from "../models/superAdmin.model";
import { UserModel } from "../models/user.model";
import { DepartmentModel } from "../models/department.model";
import { SalaryStructureModel } from "../models/salaryStructure.model";
import { EmployeeModel } from "../models/employee.model";
import { ClientModel } from "../models/client.model";
import { InvoiceTemplateModel } from "../models/invoiceTemplate.model";
import { InvoiceModel } from "../models/invoice.model";
import { PayrollModel } from "../models/payroll.model";
import { SalarySlipModel } from "../models/salarySlip.model";

// ── Helpers ───────────────────────────────────────────────────────────────────
import {
  CompanyRole,
  CompanyStatus,
  EmployeeStatus,
  EmploymentType,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  PayrollStatus,
} from "../config/constants";
import { hashPassword } from "../utils/password";
import { buildInvoiceDesign, defaultPresets } from "../utils/invoiceTemplateDefaults";
import { BaseTheme } from "../config/constants";
import { connectDatabase, disconnectDatabase } from "../config/db";
import { logger } from "../lib/logger";

// ── Config ────────────────────────────────────────────────────────────────────
const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "demo@pmsafu.com";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "Demo@1234";
const DEMO_RESET = process.env.DEMO_RESET === "true";

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_SEED_EMAIL ?? "superadmin@pmsafu.com";
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_SEED_PASSWORD ?? "Admin@1234";

// ── Utility helpers ───────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(9, 0, 0, 0);
  return d;
}

/** Returns the 1st of the month N months ago from today. */
function monthStart(monthsAgo: number): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() - monthsAgo);
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function rand(min: number, max: number): number {
  return Math.round(Math.random() * (max - min) + min);
}

function shareToken(): string {
  return randomBytes(20).toString("hex");
}

/** Compute a single salary slip's financials from a salary structure. */
function calcSlip(ss: { baseSalary: number; allowances: { name: string; type: string; value: number; taxable?: boolean }[]; deductions: { name: string; type: string; value: number }[] }) {
  const allowances = ss.allowances.map((a) => ({
    name: a.name,
    amount: a.type === "percentage_of_base" ? Math.round((a.value / 100) * ss.baseSalary) : a.value,
  }));
  const grossSalary = ss.baseSalary + allowances.reduce((s, a) => s + a.amount, 0);
  const deductions = ss.deductions.map((d) => ({
    name: d.name,
    amount: d.type === "percentage_of_base" ? Math.round((d.value / 100) * ss.baseSalary) : d.value,
  }));
  const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);
  return { allowances, deductions, grossSalary, totalDeductions, netSalary: grossSalary - totalDeductions };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  await connectDatabase();
  logger.info("Connected to database");

  // ── 0. Optional reset ──────────────────────────────────────────────────────
  if (DEMO_RESET) {
    logger.info("DEMO_RESET=true — wiping existing demo data…");
    const existing = await CompanyModel.findOne({ registrationEmail: DEMO_EMAIL });
    if (existing) {
      const cid = existing._id;
      await Promise.all([
        UserModel.deleteMany({ companyId: cid }),
        DepartmentModel.deleteMany({ companyId: cid }),
        SalaryStructureModel.deleteMany({ companyId: cid }),
        EmployeeModel.deleteMany({ companyId: cid }),
        ClientModel.deleteMany({ companyId: cid }),
        InvoiceTemplateModel.deleteMany({ companyId: cid }),
        InvoiceModel.deleteMany({ companyId: cid }),
        PayrollModel.deleteMany({ companyId: cid }),
        SalarySlipModel.deleteMany({ companyId: cid }),
        CompanyModel.deleteOne({ _id: cid }),
      ]);
      logger.info("Demo company wiped.");
    }
  }

  // ── 1. Super admin ─────────────────────────────────────────────────────────
  const existingSA = await SuperAdminModel.findOne({ email: SUPERADMIN_EMAIL });
  if (!existingSA) {
    await SuperAdminModel.create({
      name: "Platform Super Admin",
      email: SUPERADMIN_EMAIL,
      passwordHash: await hashPassword(SUPERADMIN_PASSWORD),
    });
    logger.info(`SuperAdmin created: ${SUPERADMIN_EMAIL} / ${SUPERADMIN_PASSWORD}`);
  } else {
    logger.info(`SuperAdmin already exists: ${SUPERADMIN_EMAIL}`);
  }

  // ── 2. Company ─────────────────────────────────────────────────────────────
  const existingCompany = await CompanyModel.findOne({ registrationEmail: DEMO_EMAIL });
  if (existingCompany) {
    logger.info("Demo company already exists — skipping. Set DEMO_RESET=true to reseed.");
    await disconnectDatabase();
    process.exit(0);
  }

  const company = await CompanyModel.create({
    companyName: "Sufah Solutions",
    registrationEmail: DEMO_EMAIL,
    status: CompanyStatus.APPROVED,
    isActive: true,
    onboardingCompleted: true,
    legalName: "Sufah Solutions Pvt. Ltd.",
    industry: "Technology",
    brandColor: "#0d7a58",
    phone: "+1-415-555-0100",
    website: "https://sufahsolutions.com",
    taxId: "TAX-US-88441",
    currency: "USD",
    fiscalYearStartMonth: 1,
    address: {
      line1: "123 Market Street",
      line2: "Suite 400",
      city: "San Francisco",
      state: "CA",
      postalCode: "94105",
      country: "US",
    },
    invoiceSettings: {
      prefix: "INV",
      nextNumber: 1,
      numberPadding: 4,
      defaultPaymentTermsDays: 30,
    },
    payrollSettings: {
      payDay: 1,
      defaultWorkingDaysPerMonth: 26,
      taxEnabled: true,
      taxDeductionLabel: "Income Tax",
      taxSlabs: [
        { upTo: 5000, rate: 0 },
        { upTo: 10000, rate: 10 },
        { rate: 20 },
      ],
    },
    reviewedAt: daysAgo(370),
  });
  const companyId = company._id;
  logger.info(`Company created: ${company.companyName} (${companyId})`);

  // ── 3. Invoice templates ───────────────────────────────────────────────────
  const presets = defaultPresets({ brandColor: "#0d7a58" });
  const templateDocs = await InvoiceTemplateModel.insertMany(
    presets.map((p) => ({ ...p, companyId })),
  );
  const defaultTemplate = templateDocs.find((t) => t.isDefault) ?? templateDocs[0]!;
  company.invoiceSettings.defaultTemplateId = defaultTemplate._id;
  await company.save();
  logger.info(`Invoice templates created (${templateDocs.length})`);

  // ── 4. Departments ─────────────────────────────────────────────────────────
  const deptData = [
    { name: "Engineering", description: "Software development and infrastructure" },
    { name: "Product & Design", description: "Product management and UX design" },
    { name: "Sales & Marketing", description: "Revenue generation and brand presence" },
    { name: "Finance", description: "Accounting, payroll, and financial planning" },
    { name: "Human Resources", description: "People operations and talent management" },
    { name: "Customer Success", description: "Onboarding, support, and retention" },
  ];

  const depts = await DepartmentModel.insertMany(
    deptData.map((d) => ({ ...d, companyId, isActive: true })),
  );
  const deptMap = Object.fromEntries(depts.map((d) => [d.name, d._id]));
  logger.info(`Departments created (${depts.length})`);

  // ── 5. Salary structures ───────────────────────────────────────────────────
  const structureData = [
    {
      name: "Junior Engineer",
      baseSalary: 5500,
      allowances: [
        { name: "Housing Allowance", type: "fixed", value: 500, taxable: false },
        { name: "Transport", type: "fixed", value: 200, taxable: false },
      ],
      deductions: [
        { name: "Provident Fund", type: "percentage_of_base", value: 5 },
        { name: "Health Insurance", type: "fixed", value: 150 },
      ],
    },
    {
      name: "Senior Engineer",
      baseSalary: 9000,
      allowances: [
        { name: "Housing Allowance", type: "fixed", value: 900, taxable: false },
        { name: "Transport", type: "fixed", value: 300, taxable: false },
        { name: "Performance Bonus", type: "percentage_of_base", value: 5, taxable: true },
      ],
      deductions: [
        { name: "Provident Fund", type: "percentage_of_base", value: 5 },
        { name: "Health Insurance", type: "fixed", value: 250 },
        { name: "Income Tax", type: "percentage_of_base", value: 12 },
      ],
    },
    {
      name: "Manager",
      baseSalary: 12000,
      allowances: [
        { name: "Housing Allowance", type: "fixed", value: 1200, taxable: false },
        { name: "Car Allowance", type: "fixed", value: 600, taxable: false },
        { name: "Performance Bonus", type: "percentage_of_base", value: 8, taxable: true },
      ],
      deductions: [
        { name: "Provident Fund", type: "percentage_of_base", value: 5 },
        { name: "Health Insurance", type: "fixed", value: 350 },
        { name: "Income Tax", type: "percentage_of_base", value: 15 },
      ],
    },
    {
      name: "Sales Representative",
      baseSalary: 5000,
      allowances: [
        { name: "Commission", type: "percentage_of_base", value: 10, taxable: true },
        { name: "Transport", type: "fixed", value: 300, taxable: false },
      ],
      deductions: [
        { name: "Provident Fund", type: "percentage_of_base", value: 5 },
        { name: "Health Insurance", type: "fixed", value: 150 },
      ],
    },
    {
      name: "Support Staff",
      baseSalary: 4000,
      allowances: [
        { name: "Housing Allowance", type: "fixed", value: 400, taxable: false },
        { name: "Transport", type: "fixed", value: 150, taxable: false },
      ],
      deductions: [
        { name: "Provident Fund", type: "percentage_of_base", value: 5 },
        { name: "Health Insurance", type: "fixed", value: 100 },
      ],
    },
  ];

  const structures = await SalaryStructureModel.insertMany(
    structureData.map((s) => ({ ...s, companyId, isTemplate: false, effectiveFrom: daysAgo(400) })),
  );
  const ssMap = Object.fromEntries(structures.map((s) => [s.name, s]));
  logger.info(`Salary structures created (${structures.length})`);

  // ── 6. Employees ───────────────────────────────────────────────────────────
  const employeeData = [
    // Engineering
    { firstName: "James", lastName: "Wheeler", email: "james.wheeler@sufahsolutions.com", designation: "Engineering Manager", dept: "Engineering", ss: "Manager", type: EmploymentType.FULL_TIME, joinDaysAgo: 730 },
    { firstName: "Aisha", lastName: "Rahman", email: "aisha.rahman@sufahsolutions.com", designation: "Senior Backend Engineer", dept: "Engineering", ss: "Senior Engineer", type: EmploymentType.FULL_TIME, joinDaysAgo: 500 },
    { firstName: "Carlos", lastName: "Mendes", email: "carlos.mendes@sufahsolutions.com", designation: "Junior Frontend Engineer", dept: "Engineering", ss: "Junior Engineer", type: EmploymentType.FULL_TIME, joinDaysAgo: 280 },
    // Product & Design
    { firstName: "Priya", lastName: "Nair", email: "priya.nair@sufahsolutions.com", designation: "Product Manager", dept: "Product & Design", ss: "Manager", type: EmploymentType.FULL_TIME, joinDaysAgo: 600 },
    { firstName: "Liam", lastName: "Foster", email: "liam.foster@sufahsolutions.com", designation: "UI/UX Designer", dept: "Product & Design", ss: "Junior Engineer", type: EmploymentType.FULL_TIME, joinDaysAgo: 310 },
    // Sales & Marketing
    { firstName: "Sofia", lastName: "Estrada", email: "sofia.estrada@sufahsolutions.com", designation: "Sales Manager", dept: "Sales & Marketing", ss: "Manager", type: EmploymentType.FULL_TIME, joinDaysAgo: 680 },
    { firstName: "Noah", lastName: "Campbell", email: "noah.campbell@sufahsolutions.com", designation: "Account Executive", dept: "Sales & Marketing", ss: "Sales Representative", type: EmploymentType.FULL_TIME, joinDaysAgo: 350 },
    // Finance
    { firstName: "Mei", lastName: "Zhang", email: "mei.zhang@sufahsolutions.com", designation: "Senior Accountant", dept: "Finance", ss: "Senior Engineer", type: EmploymentType.FULL_TIME, joinDaysAgo: 720 },
    // Human Resources
    { firstName: "Tariq", lastName: "Hassan", email: "tariq.hassan@sufahsolutions.com", designation: "HR Manager", dept: "Human Resources", ss: "Manager", type: EmploymentType.FULL_TIME, joinDaysAgo: 800 },
    { firstName: "Amara", lastName: "Osei", email: "amara.osei@sufahsolutions.com", designation: "HR Generalist", dept: "Human Resources", ss: "Support Staff", type: EmploymentType.FULL_TIME, joinDaysAgo: 400 },
    // Customer Success
    { firstName: "Dylan", lastName: "Park", email: "dylan.park@sufahsolutions.com", designation: "Customer Success Lead", dept: "Customer Success", ss: "Senior Engineer", type: EmploymentType.FULL_TIME, joinDaysAgo: 450 },
    { firstName: "Layla", lastName: "Ahmed", email: "layla.ahmed@sufahsolutions.com", designation: "Support Specialist", dept: "Customer Success", ss: "Support Staff", type: EmploymentType.CONTRACT, joinDaysAgo: 200 },
  ];

  const employees = await EmployeeModel.insertMany(
    employeeData.map((e, i) => ({
      companyId,
      employeeCode: `EMP-${String(i + 1).padStart(3, "0")}`,
      firstName: e.firstName,
      lastName: e.lastName,
      email: e.email,
      phone: `+1-415-555-${String(1100 + i).padStart(4, "0")}`,
      departmentId: deptMap[e.dept],
      designation: e.designation,
      employmentType: e.type,
      dateOfJoining: daysAgo(e.joinDaysAgo),
      status: EmployeeStatus.ACTIVE,
      salaryStructureId: ssMap[e.ss]!._id,
      bankDetails: {
        accountTitle: `${e.firstName} ${e.lastName}`,
        accountNumber: `US${rand(10000000, 99999999)}`,
        bankName: pick(["Chase Bank", "Bank of America", "Wells Fargo", "Citibank"]),
        branchCode: String(rand(100, 999)),
      },
    })),
  );
  logger.info(`Employees created (${employees.length})`);

  // Set dept heads
  await DepartmentModel.updateOne({ _id: deptMap["Engineering"] }, { headOfDepartment: employees[0]!._id });
  await DepartmentModel.updateOne({ _id: deptMap["Product & Design"] }, { headOfDepartment: employees[3]!._id });
  await DepartmentModel.updateOne({ _id: deptMap["Sales & Marketing"] }, { headOfDepartment: employees[5]!._id });
  await DepartmentModel.updateOne({ _id: deptMap["Human Resources"] }, { headOfDepartment: employees[8]!._id });

  // ── 7. Users ───────────────────────────────────────────────────────────────
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  // Company admin (the registration email user)
  const adminUser = await UserModel.create({
    companyId,
    name: "Sufyan Liaqat",
    email: DEMO_EMAIL,
    passwordHash,
    role: CompanyRole.COMPANY_ADMIN,
    emailVerified: true,
    isActive: true,
    lastLoginAt: daysAgo(0),
  });

  // HR Manager → linked to Tariq Hassan
  const hrUser = await UserModel.create({
    companyId,
    name: employees[8]!.firstName + " " + employees[8]!.lastName,
    email: employees[8]!.email,
    passwordHash,
    role: CompanyRole.HR_MANAGER,
    emailVerified: true,
    isActive: true,
    employeeId: employees[8]!._id,
  });

  // Accountant → linked to Mei Zhang
  const accountantUser = await UserModel.create({
    companyId,
    name: employees[7]!.firstName + " " + employees[7]!.lastName,
    email: employees[7]!.email,
    passwordHash,
    role: CompanyRole.ACCOUNTANT,
    emailVerified: true,
    isActive: true,
    employeeId: employees[7]!._id,
  });

  // Staff → linked to James Wheeler (engineering manager)
  const staffUser1 = await UserModel.create({
    companyId,
    name: employees[0]!.firstName + " " + employees[0]!.lastName,
    email: employees[0]!.email,
    passwordHash,
    role: CompanyRole.STAFF,
    emailVerified: true,
    isActive: true,
    employeeId: employees[0]!._id,
  });

  // Staff → linked to Sofia Estrada (sales manager)
  const staffUser2 = await UserModel.create({
    companyId,
    name: employees[5]!.firstName + " " + employees[5]!.lastName,
    email: employees[5]!.email,
    passwordHash,
    role: CompanyRole.STAFF,
    emailVerified: true,
    isActive: true,
    employeeId: employees[5]!._id,
  });

  logger.info(`Users created: admin=${DEMO_EMAIL}, hr=${hrUser.email}, accountant=${accountantUser.email}`);

  // Link employee userId back
  await EmployeeModel.updateOne({ _id: employees[8]!._id }, { userId: hrUser._id });
  await EmployeeModel.updateOne({ _id: employees[7]!._id }, { userId: accountantUser._id });
  await EmployeeModel.updateOne({ _id: employees[0]!._id }, { userId: staffUser1._id });
  await EmployeeModel.updateOne({ _id: employees[5]!._id }, { userId: staffUser2._id });

  const adminId = adminUser._id;

  // ── 8. Clients ─────────────────────────────────────────────────────────────
  const clientData = [
    { name: "Apex Dynamics Inc.", email: "billing@apexdynamics.com", companyNameOfClient: "Apex Dynamics Inc.", phone: "+1-212-555-0201", city: "New York", country: "US" },
    { name: "BlueWave Consulting", email: "accounts@bluewaveconsulting.com", companyNameOfClient: "BlueWave Consulting LLC", phone: "+1-312-555-0302", city: "Chicago", country: "US" },
    { name: "Orion Tech", email: "finance@oriontech.io", companyNameOfClient: "Orion Technologies Ltd.", phone: "+1-512-555-0403", city: "Austin", country: "US" },
    { name: "Nimbus Analytics", email: "payables@nimbusanalytics.co", companyNameOfClient: "Nimbus Analytics Corp.", phone: "+1-415-555-0504", city: "San Francisco", country: "US" },
    { name: "PeakSoft Solutions", email: "ar@peaksoft.com", companyNameOfClient: "PeakSoft Solutions GmbH", phone: "+49-30-555-0605", city: "Berlin", country: "DE" },
    { name: "Crestview Media", email: "billing@crestviewmedia.tv", companyNameOfClient: "Crestview Media Group", phone: "+44-20-555-0706", city: "London", country: "GB" },
    { name: "IronGrid Systems", email: "accounts@irongridsystems.com", companyNameOfClient: "IronGrid Systems Inc.", phone: "+1-604-555-0807", city: "Vancouver", country: "CA" },
    { name: "Solis Creative", email: "finance@soliscreative.agency", companyNameOfClient: "Solis Creative Agency", phone: "+1-305-555-0908", city: "Miami", country: "US" },
  ];

  const clients = await ClientModel.insertMany(
    clientData.map((c) => ({
      ...c,
      companyId,
      isActive: true,
      billingAddress: { city: c.city, country: c.country },
      totalInvoiced: 0,
      totalOutstanding: 0,
    })),
  );
  logger.info(`Clients created (${clients.length})`);

  // ── 9. Invoices ─────────────────────────────────────────────────────────────
  // Build ~130 invoices spread over the past 12 months with varied amounts & statuses.
  // Each month gets a mix so charts are interesting.

  const serviceLines = [
    { description: "Software Development — Sprint Retainer", unitPrice: 8500 },
    { description: "UI/UX Design Services", unitPrice: 4200 },
    { description: "API Integration & Deployment", unitPrice: 3800 },
    { description: "Cloud Infrastructure Setup", unitPrice: 5600 },
    { description: "Mobile App Development", unitPrice: 12000 },
    { description: "Data Analytics Dashboard", unitPrice: 7200 },
    { description: "Security Audit & Penetration Testing", unitPrice: 6500 },
    { description: "SEO & Content Strategy", unitPrice: 2800 },
    { description: "Technical Consulting (Monthly)", unitPrice: 4000 },
    { description: "QA & Testing Services", unitPrice: 3200 },
    { description: "DevOps & CI/CD Setup", unitPrice: 5100 },
    { description: "Product Strategy Workshop", unitPrice: 2500 },
    { description: "Annual SaaS License", unitPrice: 9600 },
    { description: "Training & Onboarding Package", unitPrice: 1800 },
    { description: "Customer Support SLA (Quarterly)", unitPrice: 3600 },
  ];

  const invoices = [];
  let invoiceSeq = 1;

  // Deterministic status distribution per month
  const statusMatrix: InvoiceStatus[][] = [
    // months 12→10 ago: mostly paid, some cancelled
    [InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.CANCELLED, InvoiceStatus.PAID],
    [InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.CANCELLED, InvoiceStatus.PAID, InvoiceStatus.PAID],
    [InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.OVERDUE, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID],
    // months 9→7 ago: mix of paid / partially paid / overdue
    [InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.OVERDUE, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID],
    [InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.OVERDUE, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID],
    [InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.OVERDUE, InvoiceStatus.PAID, InvoiceStatus.PAID],
    // months 6→4 ago
    [InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.SENT],
    [InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.SENT, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE, InvoiceStatus.PAID],
    [InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.SENT, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE],
    // months 3→1 ago: recent, more outstanding
    [InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.SENT, InvoiceStatus.PAID, InvoiceStatus.SENT, InvoiceStatus.OVERDUE, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PAID, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.SENT, InvoiceStatus.OVERDUE],
    [InvoiceStatus.SENT, InvoiceStatus.PAID, InvoiceStatus.SENT, InvoiceStatus.PAID, InvoiceStatus.OVERDUE, InvoiceStatus.PAID, InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID, InvoiceStatus.SENT, InvoiceStatus.PAID, InvoiceStatus.OVERDUE],
    // current month: mix of draft/sent/paid
    [InvoiceStatus.DRAFT, InvoiceStatus.SENT, InvoiceStatus.PAID, InvoiceStatus.DRAFT, InvoiceStatus.SENT, InvoiceStatus.PAID, InvoiceStatus.SENT, InvoiceStatus.DRAFT, InvoiceStatus.PAID, InvoiceStatus.SENT, InvoiceStatus.DRAFT, InvoiceStatus.SENT],
  ];

  for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
    const monthsAgo = 11 - monthIdx; // 11 ago → 0 ago
    const statuses = statusMatrix[monthIdx]!;

    for (let inv = 0; inv < statuses.length; inv++) {
      const status = statuses[inv]!;
      const client = clients[inv % clients.length]!;
      const svcLine = serviceLines[(monthIdx * 3 + inv) % serviceLines.length]!;
      const qty = rand(1, 4);
      const unitPrice = svcLine.unitPrice + rand(-500, 1500);
      const taxRate = pick([0, 0, 5, 10]);
      const discount = pick([0, 0, 0, 5, 10]);
      const lineAmount = parseFloat((qty * unitPrice * (1 - discount / 100) * (1 + taxRate / 100)).toFixed(2));
      const subTotal = qty * unitPrice;
      const totalDiscount = parseFloat((subTotal * discount / 100).toFixed(2));
      const totalTax = parseFloat(((subTotal - totalDiscount) * taxRate / 100).toFixed(2));
      const shippingFee = pick([0, 0, 0, 50, 100]);
      const grandTotal = parseFloat((subTotal - totalDiscount + totalTax + shippingFee).toFixed(2));

      const issueDate = new Date(monthStart(monthsAgo));
      issueDate.setDate(rand(1, 25));
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 30);

      let amountPaid = 0;
      let amountDue = grandTotal;
      const paymentHistory = [];
      let paidOn: Date | undefined;
      let sentAt: Date | undefined;

      if (status === InvoiceStatus.PAID) {
        amountPaid = grandTotal;
        amountDue = 0;
        paidOn = new Date(dueDate);
        paidOn.setDate(paidOn.getDate() - rand(0, 15));
        sentAt = new Date(issueDate);
        sentAt.setDate(sentAt.getDate() + 1);
        paymentHistory.push({
          amount: grandTotal,
          paidOn,
          method: pick([PaymentMethod.BANK_TRANSFER, PaymentMethod.CARD, PaymentMethod.CHEQUE]),
          reference: `REF-${rand(100000, 999999)}`,
          recordedBy: adminId,
        });
      } else if (status === InvoiceStatus.PARTIALLY_PAID) {
        amountPaid = parseFloat((grandTotal * pick([0.3, 0.4, 0.5, 0.6]) as number).toFixed(2));
        amountDue = parseFloat((grandTotal - amountPaid).toFixed(2));
        sentAt = new Date(issueDate);
        sentAt.setDate(sentAt.getDate() + 1);
        const partialDate = new Date(dueDate);
        partialDate.setDate(partialDate.getDate() - rand(5, 20));
        paymentHistory.push({
          amount: amountPaid,
          paidOn: partialDate,
          method: PaymentMethod.BANK_TRANSFER,
          reference: `REF-${rand(100000, 999999)}`,
          recordedBy: adminId,
        });
      } else if (status === InvoiceStatus.OVERDUE) {
        sentAt = new Date(issueDate);
        sentAt.setDate(sentAt.getDate() + 1);
      } else if (status === InvoiceStatus.SENT) {
        sentAt = new Date(issueDate);
        sentAt.setDate(sentAt.getDate() + 1);
      }

      const invoiceNumber = `INV-${String(invoiceSeq++).padStart(4, "0")}`;

      invoices.push({
        companyId,
        invoiceNumber,
        clientId: client._id,
        templateId: defaultTemplate._id,
        status,
        issueDate,
        dueDate,
        items: [
          {
            description: svcLine.description,
            quantity: qty,
            unitPrice,
            taxRate,
            discount,
            discountType: "percentage",
            amount: lineAmount,
          },
        ],
        subTotal,
        totalTax,
        totalDiscount,
        shippingFee,
        grandTotal,
        amountPaid,
        amountDue,
        currency: "USD",
        notes: "Payment due within 30 days. Thank you for your business.",
        termsAndConditions: "All services rendered per the signed Statement of Work.",
        paymentHistory,
        shareToken: status !== InvoiceStatus.DRAFT ? shareToken() : undefined,
        sentAt,
        paidOn,
        reminderCount: status === InvoiceStatus.OVERDUE ? rand(1, 3) : 0,
        createdBy: adminId,
      });
    }
  }

  await InvoiceModel.insertMany(invoices);

  // Update client totals
  for (const client of clients) {
    const clientInvs = invoices.filter((inv) => String(inv.clientId) === String(client._id));
    const totalInvoiced = clientInvs.reduce((s, inv) => s + inv.grandTotal, 0);
    const totalOutstanding = clientInvs.reduce((s, inv) => s + inv.amountDue, 0);
    await ClientModel.updateOne({ _id: client._id }, { totalInvoiced, totalOutstanding });
  }

  // Update company invoice counter
  await CompanyModel.updateOne(
    { _id: companyId },
    { "invoiceSettings.nextNumber": invoiceSeq },
  );

  logger.info(`Invoices created (${invoices.length})`);

  // ── 10. Payroll runs + salary slips ────────────────────────────────────────
  // One payroll run per month for the last 12 months (all completed).
  // Current month is "processing".

  for (let mAgo = 11; mAgo >= 0; mAgo--) {
    const periodDate = monthStart(mAgo);
    const month = periodDate.getMonth() + 1;
    const year = periodDate.getFullYear();
    const isCurrentMonth = mAgo === 0;
    const status = isCurrentMonth ? PayrollStatus.PROCESSING : PayrollStatus.COMPLETED;
    const processedAt = isCurrentMonth ? undefined : new Date(periodDate.getFullYear(), periodDate.getMonth(), 28);

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    const payroll = await PayrollModel.create({
      companyId,
      period: { month, year },
      status,
      processedBy: adminId,
      processedAt,
      totalGross: 0,
      totalDeductions: 0,
      totalNet: 0,
      employeeCount: employees.length,
      notes: isCurrentMonth ? "Processing in progress" : `Payroll for ${periodDate.toLocaleString("default", { month: "long" })} ${year}`,
    });

    // Salary slips for each employee
    const slips = employees.map((emp) => {
      const structure = structures.find((s) => String(s._id) === String(emp.salaryStructureId))!;
      const { allowances, deductions, grossSalary, totalDeductions: td, netSalary } = calcSlip(structure);

      // Add small random variation (±3%) to simulate actuals
      const variance = 1 + (Math.random() - 0.5) * 0.06;
      const adjGross = Math.round(grossSalary * variance);
      const adjNet = Math.round(netSalary * variance);
      const adjDeductions = Math.round(td * variance);

      totalGross += adjGross;
      totalDeductions += adjDeductions;
      totalNet += adjNet;

      const workingDays = 26;
      const presentDays = rand(22, 26);
      const paymentStatus = isCurrentMonth ? PaymentStatus.PENDING : PaymentStatus.PAID;
      const paidOn = isCurrentMonth ? undefined : new Date(year, month - 1, 28);

      return {
        companyId,
        payrollId: payroll._id,
        employeeId: emp._id,
        period: { month, year },
        baseSalary: structure.baseSalary,
        allowances,
        deductions,
        grossSalary: adjGross,
        totalDeductions: adjDeductions,
        netSalary: adjNet,
        workingDays,
        presentDays,
        paymentStatus,
        paidOn,
      };
    });

    await SalarySlipModel.insertMany(slips);

    await PayrollModel.updateOne(
      { _id: payroll._id },
      { totalGross, totalDeductions, totalNet },
    );
  }

  logger.info(`Payroll runs + salary slips created (12 months × ${employees.length} employees)`);

  // ── Done ───────────────────────────────────────────────────────────────────
  logger.info("─────────────────────────────────────────────");
  logger.info("✅  Demo seed complete!");
  logger.info("");
  logger.info("  Super Admin");
  logger.info(`    Email:    ${SUPERADMIN_EMAIL}`);
  logger.info(`    Password: ${SUPERADMIN_PASSWORD}`);
  logger.info("");
  logger.info("  Company Admin");
  logger.info(`    Email:    ${DEMO_EMAIL}`);
  logger.info(`    Password: ${DEMO_PASSWORD}`);
  logger.info("");
  logger.info("  Other users (same password)");
  logger.info(`    HR:          ${hrUser.email}`);
  logger.info(`    Accountant:  ${accountantUser.email}`);
  logger.info(`    Staff 1:     ${staffUser1.email}`);
  logger.info(`    Staff 2:     ${staffUser2.email}`);
  logger.info("─────────────────────────────────────────────");

  await disconnectDatabase();
  process.exit(0);
}

seed().catch((err) => {
  logger.error("Seed failed", { error: (err as Error).message, stack: (err as Error).stack });
  process.exit(1);
});
