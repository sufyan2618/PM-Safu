export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  description?: string;
  isDefault: boolean;
  isArchived: boolean;
}
