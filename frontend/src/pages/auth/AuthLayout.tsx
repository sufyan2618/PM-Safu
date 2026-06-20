import type { ReactNode } from 'react';
import { Brand } from '@/components/layout/Brand';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Form column */}
      <div className="flex flex-col px-6 py-10 sm:px-12">
        <Brand />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <h1 className="text-display-lg text-ink-900">{title}</h1>
            <p className="mt-2 text-body text-ink-600">{subtitle}</p>
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6 text-center text-body-sm text-ink-600">{footer}</div>}
          </div>
        </div>
        <p className="text-caption text-ink-400">© {new Date().getFullYear()} Ledger Finance</p>
      </div>

      {/* Brand / ledger panel */}
      <div className="relative hidden overflow-hidden bg-ink-900 lg:block">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 39px, #fff 39px, #fff 40px)',
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="ledger-rule w-16 border-t-2" />
          <div>
            <p className="font-data text-caption uppercase tracking-[0.2em] text-accent-600">
              Invoice &amp; Payroll
            </p>
            <h2 className="mt-4 max-w-md text-display-lg font-semibold leading-tight">
              Run billing and payroll with the calm of a balanced ledger.
            </h2>
            <p className="mt-4 max-w-md text-body text-white/60">
              Send branded invoices, track outstanding balances, and process payroll — all from one
              precise, numbers-first workspace.
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-6">
            {[
              ['$486K', 'Tracked revenue'],
              ['11', 'Active employees'],
              ['98%', 'On-time payroll'],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="font-data text-display-sm font-medium">{value}</dt>
                <dd className="mt-1 text-caption text-white/50">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
