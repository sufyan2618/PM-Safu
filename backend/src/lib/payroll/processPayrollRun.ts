import type { Types } from "mongoose";
import { EmployeeStatus, PayrollStatus } from "../../config/constants";
import { CompanyModel } from "../../models/company.model";
import { EmployeeModel } from "../../models/employee.model";
import { SalaryStructureModel } from "../../models/salaryStructure.model";
import { SalarySlipModel } from "../../models/salarySlip.model";
import { PayrollModel } from "../../models/payroll.model";
import { computeSalarySlip } from "../../utils/payrollCalculator";
import { logger } from "../logger";

interface ProcessOptions {
  payrollId: string | Types.ObjectId;
  companyId: string | Types.ObjectId;
  employeeIds?: string[];
}

/**
 * Generates a salary slip for every active employee in the run and rolls up
 * the payroll totals. Idempotent per (payroll, employee) via upsert.
 */
export async function processPayrollRun(options: ProcessOptions): Promise<void> {
  const payroll = await PayrollModel.findOne({ _id: options.payrollId, companyId: options.companyId });
  if (!payroll) throw new Error("Payroll run not found");

  payroll.status = PayrollStatus.PROCESSING;
  await payroll.save();

  try {
    const company = await CompanyModel.findById(options.companyId).select("payrollSettings");
    const workingDays = company?.payrollSettings.defaultWorkingDaysPerMonth ?? 26;

    const employeeFilter: Record<string, unknown> = {
      companyId: options.companyId,
      status: EmployeeStatus.ACTIVE,
    };
    if (options.employeeIds && options.employeeIds.length > 0) {
      employeeFilter._id = { $in: options.employeeIds };
    }

    const employees = await EmployeeModel.find(employeeFilter);

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let count = 0;

    for (const employee of employees) {
      const structure = await SalaryStructureModel.findOne({
        _id: employee.salaryStructureId,
        companyId: options.companyId,
      });
      if (!structure) {
        logger.warn("Skipping employee without salary structure", {
          employeeId: employee._id.toString(),
        });
        continue;
      }

      const computed = computeSalarySlip(
        {
          baseSalary: structure.baseSalary,
          allowances: structure.allowances,
          deductions: structure.deductions,
        },
        { workingDays, presentDays: workingDays },
      );

      await SalarySlipModel.findOneAndUpdate(
        { companyId: payroll.companyId, payrollId: payroll._id, employeeId: employee._id },
        {
          companyId: payroll.companyId,
          payrollId: payroll._id,
          employeeId: employee._id,
          period: payroll.period,
          baseSalary: computed.baseSalary,
          allowances: computed.allowances,
          deductions: computed.deductions,
          grossSalary: computed.grossSalary,
          totalDeductions: computed.totalDeductions,
          netSalary: computed.netSalary,
          workingDays,
          presentDays: workingDays,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      totalGross += computed.grossSalary;
      totalDeductions += computed.totalDeductions;
      totalNet += computed.netSalary;
      count += 1;
    }

    payroll.totalGross = Math.round(totalGross * 100) / 100;
    payroll.totalDeductions = Math.round(totalDeductions * 100) / 100;
    payroll.totalNet = Math.round(totalNet * 100) / 100;
    payroll.employeeCount = count;
    payroll.status = PayrollStatus.DRAFT;
    payroll.processedAt = new Date();
    await payroll.save();
  } catch (error) {
    payroll.status = PayrollStatus.DRAFT;
    await payroll.save();
    throw error;
  }
}
