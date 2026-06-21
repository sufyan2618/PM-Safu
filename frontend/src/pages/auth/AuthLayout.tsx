import type { ReactNode } from 'react';
import { useLottie } from 'lottie-react';
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
      <div
        className="overflow-y-auto [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="flex min-h-full flex-col px-6 py-12 sm:px-12">
          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
          <div className="mb-8 flex flex-col items-center text-center">
            <img
              src="/logo.webp"
              alt="PM-Safu"
              className="h-24 w-24 rounded-2xl object-contain"
            />
          </div>
            <h1 className="text-display-lg text-ink-900">{title}</h1>
            <p className="mt-2 text-body text-ink-600">{subtitle}</p>
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6 text-center text-body-sm text-ink-600">{footer}</div>}
          </div>
          <p className="mx-auto w-full max-w-sm pt-10 text-center text-caption text-ink-400">
            © {new Date().getFullYear()} PM-Safu
          </p>
        </div>
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
              Send branded invoices, track outstanding balances, and process payroll all from one
              precise, numbers-first workspace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
