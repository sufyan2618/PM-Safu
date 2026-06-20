import type { AxiosResponse } from 'axios';
import { axiosClient } from '../axiosClient';
import { ENDPOINTS } from '../endpoints';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Pull a filename out of a Content-Disposition header, falling back when absent. */
function filenameFromResponse(res: AxiosResponse<Blob>, fallback: string): string {
  const header = res.headers['content-disposition'] as string | undefined;
  if (!header) return fallback;
  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const quotedMatch = /filename="?([^";]+)"?/i.exec(header);
  if (quotedMatch?.[1]) return quotedMatch[1];
  return fallback;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function downloadXlsx(url: string, fallbackName: string): Promise<void> {
  const res = await axiosClient.get<Blob>(url, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: XLSX_MIME });
  triggerDownload(blob, filenameFromResponse(res, fallbackName));
}

export const exportService = {
  invoices: () => downloadXlsx(ENDPOINTS.exports.invoices, 'invoices.xlsx'),
  clients: () => downloadXlsx(ENDPOINTS.exports.clients, 'clients.xlsx'),
  employees: () => downloadXlsx(ENDPOINTS.exports.employees, 'employees.xlsx'),
  payroll: () => downloadXlsx(ENDPOINTS.exports.payroll, 'payroll.xlsx'),
  salarySlips: () => downloadXlsx(ENDPOINTS.exports.salarySlips, 'salary-slips.xlsx'),
};
