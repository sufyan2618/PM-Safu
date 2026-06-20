import type { ICompany } from "../../models/company.model";
import type { IEmployee } from "../../models/employee.model";
import type { ISalarySlip } from "../../models/salarySlip.model";
import { monthName } from "../../utils/format";
import type { SalarySlipRenderData } from "./renderData";

function formatDate(value?: Date): string | undefined {
  if (!value) return undefined;
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Assembles everything the salary-slip PDF needs from the raw documents. */
export function buildSalarySlipRenderData(
  slip: ISalarySlip,
  company: Pick<
    ICompany,
    "companyName" | "legalName" | "logoUrl" | "currency" | "address" | "phone" | "registrationEmail"
  > | null,
  employee: IEmployee,
  departmentName?: string,
): SalarySlipRenderData {
  const addr = company?.address;
  const companyAddressLines = [
    [addr?.line1, addr?.line2].filter(Boolean).join(", "),
    [addr?.city, addr?.state, addr?.postalCode].filter(Boolean).join(", "),
    addr?.country,
  ].filter((line): line is string => Boolean(line && line.length));

  return {
    companyName: company?.legalName || company?.companyName || "Company",
    companyLogoUrl: company?.logoUrl,
    companyAddressLines,
    companyPhone: company?.phone,
    companyEmail: company?.registrationEmail,
    employeeName: `${employee.firstName} ${employee.lastName}`.trim(),
    employeeCode: employee.employeeCode,
    designation: employee.designation,
    department: departmentName,
    employmentType: employee.employmentType,
    email: employee.email,
    phone: employee.phone,
    dateOfJoining: formatDate(employee.dateOfJoining),
    bankName: employee.bankDetails?.bankName,
    accountNumber: employee.bankDetails?.accountNumber,
    accountTitle: employee.bankDetails?.accountTitle,
    period: `${monthName(slip.period.month)} ${slip.period.year}`,
    currency: company?.currency ?? "USD",
    baseSalary: slip.baseSalary,
    allowances: slip.allowances,
    deductions: slip.deductions,
    grossSalary: slip.grossSalary,
    totalDeductions: slip.totalDeductions,
    netSalary: slip.netSalary,
    workingDays: slip.workingDays,
    presentDays: slip.presentDays,
    paymentStatus: slip.paymentStatus,
    paidOn: formatDate(slip.paidOn),
  };
}
