import type { ReactNode } from 'react';
import { useLottie } from 'lottie-react';
import { Brand } from '@/components/layout/Brand';
import loginAnimation from '@/animations/Login.json';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

function LoginAnimation() {
  const { View } = useLottie({
    animationData: loginAnimation,
    loop: true,
    autoplay: true,
  });
  return <div className="mx-auto w-full max-w-xs">{View}</div>;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid h-dvh overflow-hidden lg:grid-cols-2">
      {/* Form column */}
      <div className="flex flex-col overflow-y-auto px-6 py-10 sm:px-12">
        <Brand />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <h1 className="text-display-lg text-ink-900">{title}</h1>
            <p className="mt-2 text-body text-ink-600">{subtitle}</p>
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6 text-center text-body-sm text-ink-600">{footer}</div>}
          </div>
        </div>
        <p className="text-caption text-ink-400">© {new Date().getFullYear()} PM-Safu</p>
      </div>

      {/* Brand / animation panel — desktop only */}
      <div className="relative hidden h-dvh overflow-hidden bg-[#0e1320] lg:block">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 39px, #fff 39px, #fff 40px)',
          }}
        />
        <div className="relative flex h-full flex-col items-center justify-center gap-6 p-10 text-white">
          <LoginAnimation />
          <div className="mx-auto max-w-md text-center">
            <p className="font-data text-caption uppercase tracking-[0.2em] text-accent-500">
              Invoice &amp; Payroll
            </p>
            <h2 className="mt-3 text-display-sm font-semibold leading-tight text-white">
              Run billing and payroll with the calm of a balanced ledger.
            </h2>
            <p className="mt-3 text-body-sm text-white/70">
              Send branded invoices, track outstanding balances, and process payroll — all from one
              precise, numbers-first workspace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
