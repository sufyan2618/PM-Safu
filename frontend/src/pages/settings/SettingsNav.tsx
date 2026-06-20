import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { ROUTES } from '@/constants/routes.constants';
import { useAuthStore } from '@/store/authStore';

const TABS = [
  { label: 'Profile', to: ROUTES.SETTINGS_PROFILE },
  { label: 'Company', to: ROUTES.SETTINGS_COMPANY, adminOnly: true },
  { label: 'Users & roles', to: ROUTES.SETTINGS_USERS, adminOnly: true },
  { label: 'Billing', to: ROUTES.SETTINGS_BILLING, adminOnly: true },
];

export function SettingsNav() {
  const role = useAuthStore((s) => s.user?.role);
  const tabs = TABS.filter((t) => !t.adminOnly || role === 'admin');

  return (
    <div className="mb-6 border-b border-subtle">
      <div className="flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                'relative whitespace-nowrap px-4 py-2.5 text-body-sm font-medium transition-colors',
                isActive ? 'text-ink-900' : 'text-ink-400 hover:text-ink-600',
              )
            }
          >
            {({ isActive }) => (
              <>
                {tab.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent-600" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
