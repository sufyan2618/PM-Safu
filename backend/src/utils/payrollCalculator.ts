import type { ISalaryComponent } from "../models/salaryStructure.model";
import type { ITaxSlab } from "../models/company.model";
import type { ISlipLine } from "../models/salarySlip.model";

export interface ComputedSlip {
  baseSalary: number;
  allowances: ISlipLine[];
  deductions: ISlipLine[];
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  taxableIncome: number;
  incomeTax: number;
}

export interface TaxConfig {
  enabled: boolean;
  label: string;
  slabs: ITaxSlab[];
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

/**
 * Progressive income tax: each slab's rate applies only to the portion of
 * taxable income that falls within that band. The final slab may omit `upTo`
 * to act as the top (unbounded) band.
 */
export function computeProgressiveTax(taxableIncome: number, slabs: ITaxSlab[]): number {
  if (taxableIncome <= 0 || slabs.length === 0) return 0;

  const sorted = [...slabs].sort((a, b) => (a.upTo ?? Infinity) - (b.upTo ?? Infinity));
  let lastCap = 0;
  let tax = 0;

  for (const slab of sorted) {
    const cap = slab.upTo ?? Infinity;
    const band = Math.min(taxableIncome, cap) - lastCap;
    if (band > 0) tax += band * (slab.rate / 100);
    lastCap = cap;
    if (taxableIncome <= cap) break;
  }

  return round2(tax);
}

export interface SalaryStructureInput {
  baseSalary: number;
  allowances: ISalaryComponent[];
  deductions: ISalaryComponent[];
}

/**
 * Resolves a salary structure into concrete amounts for a pay period.
 * Optionally prorates by present/working days and applies a configurable
 * progressive income tax on taxable earnings (base + taxable allowances).
 */
export function computeSalarySlip(
  structure: SalaryStructureInput,
  options: { workingDays?: number; presentDays?: number; tax?: TaxConfig } = {},
): ComputedSlip {
  const { workingDays, presentDays, tax } = options;
  const prorationFactor =
    workingDays && workingDays > 0 && presentDays !== undefined ? presentDays / workingDays : 1;

  const baseSalary = round2(structure.baseSalary * prorationFactor);

  let taxableAllowanceTotal = 0;
  const allowances: ISlipLine[] = structure.allowances.map((allowance) => {
    const amount = round2(resolveComponent(allowance, structure.baseSalary) * prorationFactor);
    // `taxable` defaults to true; only explicit false excludes it from taxable income.
    if (allowance.taxable !== false) taxableAllowanceTotal += amount;
    return { name: allowance.name, amount };
  });

  const deductions: ISlipLine[] = structure.deductions.map((deduction) => ({
    name: deduction.name,
    amount: round2(resolveComponent(deduction, structure.baseSalary) * prorationFactor),
  }));

  const allowancesTotal = allowances.reduce((sum, item) => sum + item.amount, 0);
  const grossSalary = round2(baseSalary + allowancesTotal);

  // Statutory income tax on taxable earnings (base + taxable allowances).
  const taxableIncome = round2(baseSalary + taxableAllowanceTotal);
  let incomeTax = 0;
  if (tax?.enabled && tax.slabs.length > 0) {
    incomeTax = computeProgressiveTax(taxableIncome, tax.slabs);
    if (incomeTax > 0) {
      deductions.push({ name: tax.label || "Income Tax", amount: incomeTax });
    }
  }

  const totalDeductions = round2(deductions.reduce((sum, item) => sum + item.amount, 0));
  const netSalary = round2(grossSalary - totalDeductions);

  return { baseSalary, allowances, deductions, grossSalary, totalDeductions, netSalary, taxableIncome, incomeTax };
}
