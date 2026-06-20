import { create } from 'zustand';

interface PayrollRunWizardState {
  currentStep: number;
  selectedPeriod: string;
  selectedDepartmentIds: string[];
  reviewedEmployeeIds: string[];
  setPeriod: (period: string) => void;
  setDepartments: (ids: string[]) => void;
  toggleReviewed: (id: string) => void;
  setReviewed: (ids: string[]) => void;
  goToStep: (step: number) => void;
  reset: () => void;
}

const today = new Date();
const defaultPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

export const usePayrollRunStore = create<PayrollRunWizardState>((set) => ({
  currentStep: 0,
  selectedPeriod: defaultPeriod,
  selectedDepartmentIds: [],
  reviewedEmployeeIds: [],
  setPeriod: (selectedPeriod) => set({ selectedPeriod }),
  setDepartments: (selectedDepartmentIds) => set({ selectedDepartmentIds }),
  toggleReviewed: (id) =>
    set((state) => ({
      reviewedEmployeeIds: state.reviewedEmployeeIds.includes(id)
        ? state.reviewedEmployeeIds.filter((x) => x !== id)
        : [...state.reviewedEmployeeIds, id],
    })),
  setReviewed: (reviewedEmployeeIds) => set({ reviewedEmployeeIds }),
  goToStep: (currentStep) => set({ currentStep }),
  reset: () =>
    set({
      currentStep: 0,
      selectedPeriod: defaultPeriod,
      selectedDepartmentIds: [],
      reviewedEmployeeIds: [],
    }),
}));
