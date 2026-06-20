import { formatCurrency } from '@/utils/formatCurrency';
import { formatPeriod } from '@/utils/formatDate';
import type { SalarySlip } from '@/types';

export function SalarySlipPreview({ slip }: { slip: SalarySlip }) {
  const basic = slip.grossSalary - slip.allowances.reduce((s, a) => s + a.amount, 0);

  return (
    <div className="overflow-hidden rounded-xl border border-subtle bg-white text-[#0E1320] shadow-card">
      <div className="flex items-center justify-between border-b border-[#E4E7EC] p-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0E7C5A]">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 4.5h12M3 9h12M3 13.5h7" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <p className="text-[15px] font-semibold">Northwind Trading Co.</p>
            <p className="text-[11px] text-[#4B5468]">Salary Statement</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-[#8A92A3]">Pay period</p>
          <p className="font-data text-[13px] font-medium">{formatPeriod(slip.period)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-b border-[#E4E7EC] p-6 text-[12px]">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-[#8A92A3]">Employee</p>
          <p className="font-medium">{slip.employee?.name}</p>
          <p className="text-[#4B5468]">{slip.employee?.designation}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-[#8A92A3]">Employee code</p>
          <p className="font-data font-medium">{slip.employee?.employeeCode}</p>
          <p className="text-[#4B5468]">{slip.employee?.departmentName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#8A92A3]">
            Earnings
          </p>
          <SlipRow label="Basic" value={formatCurrency(basic)} />
          {slip.allowances.map((a) => (
            <SlipRow key={a.label} label={a.label} value={formatCurrency(a.amount)} />
          ))}
          <div className="mt-2 border-t border-[#0E7C5A]/20 pt-2">
            <SlipRow label="Gross" value={formatCurrency(slip.grossSalary)} strong />
          </div>
        </div>
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#8A92A3]">
            Deductions
          </p>
          {slip.deductions.map((d) => (
            <SlipRow key={d.label} label={d.label} value={formatCurrency(d.amount)} />
          ))}
          <div className="mt-2 border-t border-[#0E7C5A]/20 pt-2">
            <SlipRow label="Total" value={formatCurrency(slip.totalDeductions)} strong />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-[#0E7C5A]/10 px-6 py-4">
        <span className="text-[13px] font-semibold text-[#0E7C5A]">Net pay</span>
        <span className="font-data text-[18px] font-bold text-[#0E7C5A]">
          {formatCurrency(slip.netSalary)}
        </span>
      </div>
    </div>
  );
}

function SlipRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between py-1 text-[12px]">
      <span className={strong ? 'font-semibold' : 'text-[#4B5468]'}>{label}</span>
      <span className={`font-data ${strong ? 'font-semibold' : ''}`}>{value}</span>
    </div>
  );
}
