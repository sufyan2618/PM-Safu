import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatPeriod } from '@/utils/formatDate';
import { useAuthStore } from '@/store/authStore';
import type { SalarySlip } from '@/types';

const ACCENT = '#0E7C5A';

function titleCase(value?: string): string {
  if (!value) return '-';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function SalarySlipPreview({ slip }: { slip: SalarySlip }) {
  const company = useAuthStore((s) => s.company);
  const emp = slip.employee;
  const earnings = [{ label: 'Basic', amount: slip.baseSalary }, ...slip.allowances];
  const lopDays = Math.max(0, slip.workingDays - slip.presentDays);

  const leftRows: [string, string][] = [
    ['Employee ID', emp?.employeeCode ?? '-'],
    ['Employee Name', emp?.name ?? '-'],
    ['Designation', emp?.designation ?? '-'],
    ['Department', emp?.departmentName ?? '-'],
    ['Date of Joining', emp?.joinDate ? formatDate(emp.joinDate) : '-'],
  ];
  const rightRows: [string, string][] = [
    ['Employment', titleCase(emp?.employmentType)],
    ['Email', emp?.email || '-'],
    ['Phone', emp?.phone || '-'],
    ['Bank', emp?.bankDetails?.bankName || '-'],
    ['Account No.', emp?.bankDetails?.accountNumber || '-'],
  ];
  const summary: [string, string][] = [
    ['Gross Wages', formatCurrency(slip.grossSalary)],
    ['Total Working Days', String(slip.workingDays)],
    ['Paid Days', String(slip.presentDays)],
    ['LOP Days', String(lopDays)],
    ['Payment Status', titleCase(slip.paymentStatus)],
    ['Pay Date', slip.paidOn ? formatDate(slip.paidOn) : '-'],
  ];
  const rowCount = Math.max(earnings.length, slip.deductions.length);

  return (
    <div className="overflow-hidden rounded-xl border border-[#C9D0D8] bg-white text-[#0E1320] shadow-card">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#C9D0D8] p-5">
        {company?.logoUrl ? (
          <img src={company.logoUrl} alt="Logo" className="h-12 w-12 rounded-lg object-contain" />
        ) : (
          <span
            className="flex h-12 w-12 items-center justify-center rounded-lg text-[20px] font-bold text-white"
            style={{ backgroundColor: ACCENT }}
          >
            {(company?.companyName ?? 'C').charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-bold">{company?.companyName ?? 'Company'}</p>
          <p className="text-[11px] text-[#6B7280]">Salary Statement</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-[#8A92A3]">Pay period</p>
          <p className="font-data text-[13px] font-semibold">{formatPeriod(slip.period)}</p>
        </div>
      </div>

      {/* Title band */}
      <div className="border-b border-[#C9D0D8] bg-[#F1F4F8] py-2 text-center text-[12px] font-bold uppercase tracking-wide">
        Payslip for {formatPeriod(slip.period)}
      </div>

      {/* Employee details */}
      <div className="grid grid-cols-1 border-b border-[#C9D0D8] sm:grid-cols-2">
        <dl className="divide-y divide-[#EAEDF1] sm:border-r sm:border-[#C9D0D8]">
          {leftRows.map(([label, value]) => (
            <DetailRow key={label} label={label} value={value} />
          ))}
        </dl>
        <dl className="divide-y divide-[#EAEDF1] border-t border-[#C9D0D8] sm:border-t-0">
          {rightRows.map(([label, value]) => (
            <DetailRow key={label} label={label} value={value} />
          ))}
        </dl>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-2 border-b border-[#C9D0D8] sm:grid-cols-3">
        {summary.map(([label, value]) => (
          <div key={label} className="border-b border-r border-[#EAEDF1] px-4 py-3">
            <p className="text-[9px] uppercase tracking-wide text-[#8A92A3]">{label}</p>
            <p className="mt-0.5 font-data text-[13px] font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {/* Earnings / Deductions */}
      <div className="grid grid-cols-2">
        <div className="border-r border-[#C9D0D8]">
          <div className="bg-[#0F172A] py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-white">
            Earnings
          </div>
          {Array.from({ length: rowCount }).map((_, i) => (
            <LineRow key={i} item={earnings[i]} />
          ))}
          <TotalRow label="Total Earnings" value={formatCurrency(slip.grossSalary)} />
        </div>
        <div>
          <div className="bg-[#0F172A] py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-white">
            Deductions
          </div>
          {Array.from({ length: rowCount }).map((_, i) => (
            <LineRow key={i} item={slip.deductions[i]} />
          ))}
          <TotalRow label="Total Deductions" value={formatCurrency(slip.totalDeductions)} />
        </div>
      </div>

      {/* Net salary */}
      <div
        className="flex items-center justify-between px-5 py-3.5 text-white"
        style={{ backgroundColor: ACCENT }}
      >
        <span className="text-[13px] font-bold uppercase tracking-wide">Net Salary (Take Home)</span>
        <span className="font-data text-[18px] font-bold">{formatCurrency(slip.netSalary)}</span>
      </div>

      <p className="px-5 py-2.5 text-center text-[9px] text-[#8A92A3]">
        This is a system-generated payslip and does not require a signature.
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-[11.5px]">
      <dt className="w-28 shrink-0 text-[#6B7280]">{label}</dt>
      <dd className="text-[#6B7280]">:</dd>
      <dd className="min-w-0 flex-1 truncate font-medium text-[#0E1320]">{value}</dd>
    </div>
  );
}

function LineRow({ item }: { item?: { label: string; amount: number } }) {
  return (
    <div className="flex items-center justify-between border-b border-[#EAEDF1] px-4 py-2 text-[11.5px]">
      <span className="truncate text-[#4B5468]">{item?.label ?? '\u00A0'}</span>
      <span className="font-data">{item ? formatCurrency(item.amount) : '\u00A0'}</span>
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between bg-[#F1F4F8] px-4 py-2 text-[12px] font-bold">
      <span>{label}</span>
      <span className="font-data">{value}</span>
    </div>
  );
}
