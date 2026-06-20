export interface AiStatus {
  enabled: boolean;
  model: string;
}

export interface AiDraftItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export interface AiInvoiceDraft {
  clientId: string | null;
  clientName: string | null;
  dueDate: string | null;
  notes: string | null;
  terms: string | null;
  items: AiDraftItem[];
}

export interface AiQuestionOption {
  id: string;
  label: string;
  description?: string;
}

export type AiQuestionType = 'client_disambiguation' | 'client_select' | 'items';

export interface AiQuestion {
  id: string;
  type: AiQuestionType | string;
  prompt: string;
  options?: AiQuestionOption[];
}

export interface AiInvoiceDraftResponse {
  status: 'ready' | 'needs_input';
  draft: AiInvoiceDraft;
  questions: AiQuestion[];
  meta: { model: string };
}

export type AiAnomalyType =
  | 'salary_spike'
  | 'missing_employee'
  | 'excessive_overtime'
  | 'duplicate_payment';

export interface AiPayrollAnomaly {
  type: AiAnomalyType;
  severity: 'info' | 'warning' | 'high';
  employeeName: string;
  employeeCode?: string;
  detail: string;
}

export interface AiPayrollComparison {
  period: { month: number; year: number };
  previousPeriod: { month: number; year: number } | null;
  totalNet: number;
  totalGross: number;
  totalDeductions: number;
  employeeCount: number;
  previousTotalNet: number | null;
  changeAmount: number | null;
  changePct: number | null;
}

export interface AiPayrollDepartment {
  department: string;
  net: number;
  gross: number;
  employees: number;
}

export interface AiPayrollInsights {
  aiEnabled: boolean;
  summary: string | null;
  anomalies: AiPayrollAnomaly[];
  comparison: AiPayrollComparison;
  departments: AiPayrollDepartment[];
  model: string | null;
  generatedAt: string | null;
  cached: boolean;
}

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
