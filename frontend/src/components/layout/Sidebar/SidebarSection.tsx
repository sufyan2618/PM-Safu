import type { ReactNode } from 'react';

interface SidebarSectionProps {
  label: string;
  collapsed: boolean;
  children: ReactNode;
}

export function SidebarSection({ label, collapsed, children }: SidebarSectionProps) {
  return (
    <div className="space-y-1">
      {!collapsed ? (
        <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">
          {label}
        </p>
      ) : (
        <div className="my-2 ledger-rule mx-3" />
      )}
      {children}
    </div>
  );
}
