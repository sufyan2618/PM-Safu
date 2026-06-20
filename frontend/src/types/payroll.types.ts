export type PayrollStatus = 'draft' | 'processing' | 'completed' | 'cancelled';

export interface PayrollRun {
  id: string;
  period: string; // e.g. "2026-06"
  status: PayrollStatus;
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  processedAt?: string;
  createdAt: string;
}
