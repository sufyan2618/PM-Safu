import type { ISalaryComponent } from "../models/salaryStructure.model";
import type { ISlipLine } from "../models/salarySlip.model";

export interface ComputedSlip {
  baseSalary: number;
  allowances: ISlipLine[];
  deductions: ISlipLine[];
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function resolveComponent(component: ISalaryComponent, baseSalary: number): number {
  if (component.type === "percentage_of_base") {
    return round2((baseSalary * component.value) / 100);
  }
  return round2(component.value);
}

export interface SalaryStructureInput {
  baseSalary: number;
  allowances: ISalaryComponent[];
  deductions: ISalaryComponent[];
}

/**
 * Resolves a salary structure into concrete amounts for a pay period.
 * Optionally prorates by present/working days.
 */
export function computeSalarySlip(
  structure: SalaryStructureInput,
  options: { workingDays?: number; presentDays?: number } = {},
): ComputedSlip {
  const { workingDays, presentDays } = options;
  const prorationFactor =
    workingDays && workingDays > 0 && presentDays !== undefined ? presentDays / workingDays : 1;

  const baseSalary = round2(structure.baseSalary * prorationFactor);

  const allowances: ISlipLine[] = structure.allowances.map((allowance) => ({
    name: allowance.name,
    amount: round2(resolveComponent(allowance, structure.baseSalary) * prorationFactor),
  }));

  const deductions: ISlipLine[] = structure.deductions.map((deduction) => ({
    name: deduction.name,
    amount: round2(resolveComponent(deduction, structure.baseSalary) * prorationFactor),
  }));

  const allowancesTotal = allowances.reduce((sum, item) => sum + item.amount, 0);
  const grossSalary = round2(baseSalary + allowancesTotal);
  const totalDeductions = round2(deductions.reduce((sum, item) => sum + item.amount, 0));
  const netSalary = round2(grossSalary - totalDeductions);

  return { baseSalary, allowances, deductions, grossSalary, totalDeductions, netSalary };
}
