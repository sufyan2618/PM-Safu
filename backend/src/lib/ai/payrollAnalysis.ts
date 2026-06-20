import { Types } from "mongoose";
import { PayrollModel, type IPayroll } from "../../models/payroll.model";
import { SalarySlipModel } from "../../models/salarySlip.model";

interface SlipLine {
  name: string;
  amount: number;
}

interface PopulatedEmployee {
  _id: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  employeeCode?: string;
  departmentId?: { _id: Types.ObjectId; name?: string } | null;
}

interface LeanSlip {
  _id: Types.ObjectId;
  employeeId: PopulatedEmployee | null;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  allowances: SlipLine[];
  deductions: SlipLine[];
}

export interface PayrollAnomaly {
  type: "salary_spike" | "missing_employee" | "excessive_overtime" | "duplicate_payment";
  severity: "info" | "warning" | "high";
  employeeName: string;
  employeeCode?: string;
  detail: string;
}

export interface DepartmentCost {
  department: string;
  net: number;
  gross: number;
  employees: number;
}

function periodValue(p: { year: number; month: number }): number {
  return p.year * 12 + p.month;
}

function employeeName(emp: PopulatedEmployee | null): string {
  if (!emp) return "Unknown employee";
  return [emp.firstName, emp.lastName].filter(Boolean).join(" ") || "Unknown employee";
}

/** Load a payroll run plus its salary slips with employee + department populated. */
export async function loadRunWithSlips(companyId: string, payrollId: string) {
  const run = await PayrollModel.findOne({ _id: payrollId, companyId });
  if (!run) return null;
  const slips = (await SalarySlipModel.find({ companyId, payrollId: run._id })
    .populate({
      path: "employeeId",
      select: "firstName lastName employeeCode departmentId",
      populate: { path: "departmentId", select: "name" },
    })
    .lean()) as unknown as LeanSlip[];
  return { run, slips };
}

/** Find the chronologically-previous payroll run for the company. */
export async function findPreviousRun(
  companyId: string,
  current: IPayroll,
): Promise<IPayroll | null> {
  const runs = await PayrollModel.find({ companyId, _id: { $ne: current._id } });
  const currentVal = periodValue(current.period);
  const earlier = runs
    .filter((r) => periodValue(r.period) < currentVal)
    .sort((a, b) => periodValue(b.period) - periodValue(a.period));
  return earlier[0] ?? null;
}

export function departmentBreakdown(slips: LeanSlip[]): DepartmentCost[] {
  const map = new Map<string, DepartmentCost>();
  for (const slip of slips) {
    const name = slip.employeeId?.departmentId?.name ?? "Unassigned";
    const entry = map.get(name) ?? { department: name, net: 0, gross: 0, employees: 0 };
    entry.net += slip.netSalary ?? 0;
    entry.gross += slip.grossSalary ?? 0;
    entry.employees += 1;
    map.set(name, entry);
  }
  return [...map.values()].sort((a, b) => b.net - a.net);
}

const OVERTIME_RE = /overtime/i;

/**
 * Deterministically detect payroll anomalies by comparing the current run to the previous one.
 * Computed in code (not by the LLM) so results are predictable and auditable.
 */
export function computeAnomalies(current: LeanSlip[], previous: LeanSlip[]): PayrollAnomaly[] {
  const anomalies: PayrollAnomaly[] = [];

  const prevByEmployee = new Map<string, LeanSlip>();
  for (const slip of previous) {
    if (slip.employeeId?._id) prevByEmployee.set(String(slip.employeeId._id), slip);
  }
  const currentIds = new Set(
    current.map((s) => (s.employeeId?._id ? String(s.employeeId._id) : "")).filter(Boolean),
  );

  // Salary spikes vs the previous run.
  for (const slip of current) {
    const id = slip.employeeId?._id ? String(slip.employeeId._id) : null;
    if (!id) continue;
    const prev = prevByEmployee.get(id);
    if (prev && prev.netSalary > 0) {
      const pct = ((slip.netSalary - prev.netSalary) / prev.netSalary) * 100;
      if (pct >= 50) {
        anomalies.push({
          type: "salary_spike",
          severity: pct >= 150 ? "high" : "warning",
          employeeName: employeeName(slip.employeeId),
          employeeCode: slip.employeeId?.employeeCode,
          detail: `Net pay rose ${pct.toFixed(0)}% (from ${prev.netSalary} to ${slip.netSalary}) vs the previous run.`,
        });
      }
    }
  }

  // Employees paid previously but missing now.
  for (const [id, slip] of prevByEmployee) {
    if (!currentIds.has(id)) {
      anomalies.push({
        type: "missing_employee",
        severity: "warning",
        employeeName: employeeName(slip.employeeId),
        employeeCode: slip.employeeId?.employeeCode,
        detail: "Was included in the previous payroll run but is not in this run.",
      });
    }
  }

  // Excessive overtime relative to the run average.
  const overtimeAmounts: { slip: LeanSlip; amount: number }[] = [];
  for (const slip of current) {
    const ot = slip.allowances?.filter((a) => OVERTIME_RE.test(a.name)) ?? [];
    const amount = ot.reduce((sum, a) => sum + (a.amount ?? 0), 0);
    if (amount > 0) overtimeAmounts.push({ slip, amount });
  }
  if (overtimeAmounts.length > 0) {
    const avg = overtimeAmounts.reduce((s, o) => s + o.amount, 0) / overtimeAmounts.length;
    for (const { slip, amount } of overtimeAmounts) {
      if (avg > 0 && amount > avg * 2) {
        anomalies.push({
          type: "excessive_overtime",
          severity: "info",
          employeeName: employeeName(slip.employeeId),
          employeeCode: slip.employeeId?.employeeCode,
          detail: `Overtime of ${amount} is well above the run average of ${avg.toFixed(0)}.`,
        });
      }
    }
  }

  // Duplicate allowance/deduction entries within a single slip.
  for (const slip of current) {
    const lines = [...(slip.allowances ?? []), ...(slip.deductions ?? [])];
    const seen = new Map<string, number>();
    for (const line of lines) {
      const key = `${line.name.toLowerCase()}|${line.amount}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    const dup = [...seen.entries()].find(([, count]) => count > 1);
    if (dup) {
      anomalies.push({
        type: "duplicate_payment",
        severity: "high",
        employeeName: employeeName(slip.employeeId),
        employeeCode: slip.employeeId?.employeeCode,
        detail: "Possible duplicate pay line detected (same name and amount appears more than once).",
      });
    }
  }

  return anomalies;
}

export type { LeanSlip };
