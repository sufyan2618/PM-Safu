export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  address?: string;
  taxId?: string;
  notes?: string;
  totalInvoiced: number;
  outstandingBalance: number;
  isActive: boolean;
  createdAt: string;
}
