export type CompanyStatus = 'pending' | 'approved' | 'rejected';

export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

/** Lightweight company shape returned by the auth endpoints. */
export interface CompanySummary {
  id: string;
  companyName: string;
  status: CompanyStatus;
  isActive: boolean;
  onboardingCompleted: boolean;
  currency: string;
  logoUrl?: string;
}

export interface InvoiceSettings {
  prefix: string;
  nextNumber: number;
  numberPadding: number;
  defaultPaymentTermsDays: number;
  defaultTemplateId?: string;
}

export interface PayrollSettings {
  payDay: number;
  defaultWorkingDaysPerMonth: number;
}

/** Full company document (GET /company/me). */
export interface Company {
  id: string;
  companyName: string;
  registrationEmail: string;
  status: CompanyStatus;
  rejectionReason?: string;
  isActive: boolean;
  onboardingCompleted: boolean;
  legalName?: string;
  industry?: string;
  logoUrl?: string;
  brandColor?: string;
  address?: Address;
  phone?: string;
  website?: string;
  taxId?: string;
  currency: string;
  fiscalYearStartMonth: number;
  invoiceSettings: InvoiceSettings;
  payrollSettings: PayrollSettings;
  createdAt?: string;
  updatedAt?: string;
}
