import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Building2, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { Brand } from './Brand';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/api/services';
import { cn } from '@/lib/cn';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/companies', label: 'Companies', icon: Building2, end: false },
];

export function AdminShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const superAdmin = useAuthStore((s) => s.superAdmin);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      /* ignore network errors on logout */
    }
    logout();
    navigate('/login', { replace: true });
  };

  const navContent = (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }: { isActive: boolean }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-body-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent-100 text-accent-600'
                  : 'text-ink-600 hover:bg-sunken hover:text-ink-900',
              )
            }
          >
            <Icon size={18} strokeWidth={1.5} />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Brand />
      </div>
      <span className="ledger-rule mx-3 block" />
      {navContent}
      <div className="border-t border-subtle p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sunken text-caption font-semibold text-ink-600">
            {superAdmin?.name?.charAt(0).toUpperCase() ?? 'S'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-sm font-medium text-ink-900">
              {superAdmin?.name ?? 'Super Admin'}
            </p>
            <p className="truncate text-caption text-ink-400">{superAdmin?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-body-sm font-medium text-ink-600 transition-colors hover:bg-sunken hover:text-danger-600"
        >
          <LogOut size={18} strokeWidth={1.5} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="hidden w-64 shrink-0 border-r border-subtle bg-surface lg:block">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-subtle bg-surface">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-subtle bg-surface px-4 lg:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation"
            className="rounded-lg p-2 text-ink-600 hover:bg-sunken lg:hidden"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="lg:hidden">
            <Brand collapsed />
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
