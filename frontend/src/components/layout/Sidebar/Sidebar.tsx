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

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => !item.roles || (role && item.roles.includes(role)),
    ),
  })).filter((section) => section.items.length > 0);

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-subtle bg-surface transition-[width] duration-200',
        collapsed ? 'w-[64px]' : 'w-[240px]',
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
            className="flex h-7 w-7 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-sunken hover:text-ink-600"
          >
            {collapsed ? (
              <ChevronRight size={15} strokeWidth={2} />
            ) : (
              <ChevronLeft size={15} strokeWidth={2} />
            )}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2.5 pb-4">
        <div
          className={cn(
            'flex items-center',
            collapsed ? 'justify-center py-4' : 'px-1 pb-5 pt-3',
          )}
        >
          <CompanySwitcher collapsed={collapsed} />
        </div>

        <nav className="space-y-4">
          {visibleSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="mb-1 px-2.5 text-caption font-semibold uppercase tracking-[0.07em] text-ink-200">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarItem
                    key={item.path}
                    label={item.label}
                    icon={item.icon}
                    path={item.path}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
