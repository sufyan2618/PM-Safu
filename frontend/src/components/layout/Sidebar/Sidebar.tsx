import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Brand } from '../Brand';
import { SidebarItem } from './SidebarItem';
import { SidebarSection } from './SidebarSection';
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

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-subtle bg-surface transition-[width] duration-200',
        collapsed ? 'w-[72px]' : 'w-[264px]',
      )}
    >
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-subtle px-4',
          collapsed && 'justify-center px-0',
        )}
      >
        <Brand collapsed={collapsed} />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter(
            (item) => !item.roles || (role && item.roles.includes(role)),
          );
          if (items.length === 0) return null;
          return (
            <SidebarSection key={section.label} label={section.label} collapsed={collapsed}>
              {items.map((item) => (
                <SidebarItem
                  key={item.path}
                  label={item.label}
                  icon={item.icon}
                  path={item.path}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </SidebarSection>
          );
        })}
      </nav>

      {showCollapseToggle && (
        <div className="shrink-0 border-t border-subtle p-3">
          <button
            type="button"
            onClick={toggleSidebar}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-body-sm font-medium text-ink-600 transition-colors hover:bg-sunken hover:text-ink-900',
              collapsed && 'justify-center px-0',
            )}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} strokeWidth={1.5} />
            ) : (
              <>
                <PanelLeftClose size={18} strokeWidth={1.5} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  );
}
