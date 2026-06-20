import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CompanySwitcher } from '../CompanySwitcher';
import { SidebarItem } from './SidebarItem';
import { NAV_SECTIONS } from '@/constants/navigation.constants';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';
import type { Role } from '@/types';

interface SidebarProps {
  collapsed: boolean;
  onNavigate?: () => void;
  showCollapseToggle?: boolean;
}

export function Sidebar({ collapsed, onNavigate, showCollapseToggle = true }: SidebarProps) {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const role = useAuthStore((s) => s.user?.role) as Role | undefined;

  const navItems = NAV_SECTIONS.flatMap((section) => section.items).filter(
    (item) => !item.roles || (role && item.roles.includes(role)),
  );

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-strong bg-surface shadow-card transition-[width] duration-200',
        collapsed ? 'w-[72px]' : 'w-[264px]',
      )}
    >
      {showCollapseToggle && (
        <div
          className={cn(
            'flex shrink-0 px-3 pt-3',
            collapsed ? 'justify-center' : 'justify-end',
          )}
        >
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-subtle text-ink-600 transition-colors hover:bg-sunken hover:text-ink-900"
          >
            {collapsed ? (
              <ChevronRight size={18} strokeWidth={1.5} />
            ) : (
              <ChevronLeft size={18} strokeWidth={1.5} />
            )}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div
          className={cn(
            'flex items-center justify-center',
            collapsed ? 'py-4' : 'px-1 pb-6 pt-3',
          )}
        >
          <CompanySwitcher collapsed={collapsed} />
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <SidebarItem
              key={item.path}
              label={item.label}
              icon={item.icon}
              path={item.path}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
}
