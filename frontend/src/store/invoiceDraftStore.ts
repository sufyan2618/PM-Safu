import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Invoice, InvoiceLineItem, InvoiceTemplate } from '@/types';

interface InvoiceDraftState {
  draft: Partial<Invoice>;
  selectedTemplate: InvoiceTemplate | null;
  setField: <K extends keyof Invoice>(key: K, value: Invoice[K]) => void;
  setTemplate: (template: InvoiceTemplate | null) => void;
  addLineItem: (item: InvoiceLineItem) => void;
  updateLineItem: (id: string, patch: Partial<InvoiceLineItem>) => void;
  removeLineItem: (id: string) => void;
  reset: () => void;
}

const emptyDraft: Partial<Invoice> = { lineItems: [] };

export const useInvoiceDraftStore = create<InvoiceDraftState>()(
  immer((set) => ({
    draft: { ...emptyDraft },
    selectedTemplate: null,
    setField: (key, value) =>
      set((state) => {
        state.draft[key] = value;
      }),
    setTemplate: (template) =>
      set((state) => {
        state.selectedTemplate = template;
      }),
    addLineItem: (item) =>
      set((state) => {
        state.draft.lineItems = [...(state.draft.lineItems ?? []), item];
      }),
    updateLineItem: (id, patch) =>
      set((state) => {
        const items = state.draft.lineItems ?? [];
        const idx = items.findIndex((i) => i.id === id);
        if (idx !== -1) items[idx] = { ...items[idx], ...patch };
      }),
    removeLineItem: (id) =>
      set((state) => {
        state.draft.lineItems = (state.draft.lineItems ?? []).filter((i) => i.id !== id);
      }),
    reset: () =>
      set((state) => {
        state.draft = { ...emptyDraft };
        state.selectedTemplate = null;
      }),
  })),
);
