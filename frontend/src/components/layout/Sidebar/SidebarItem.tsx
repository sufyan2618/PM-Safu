import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Tooltip } from '@/components/ui/Tooltip';

interface SidebarItemProps {
  label: string;
  icon: LucideIcon;
  path: string;
  collapsed: boolean;
  onNavigate?: () => void;
}

export function SidebarItem({ label, icon: Icon, path, collapsed, onNavigate }: SidebarItemProps) {
  const link = (
    <NavLink
      to={path}
      end={path === '/'}
      onClick={onNavigate}
      className={({ isActive }: { isActive: boolean }) =>
        cn(
          'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-body-sm font-medium transition-all duration-150',
          collapsed && 'justify-center px-0',
          isActive
            ? 'bg-accent-50 text-accent-600 dark:bg-accent-100/40'
            : 'text-ink-600 hover:bg-sunken hover:text-ink-900',
        )
      }
    >
      {({ isActive }: { isActive: boolean }) => (
        <>
          {isActive && (
            <span className="absolute inset-y-1 left-0 w-[3px] rounded-r-full bg-accent-600 opacity-90" />
          )}
          <Icon
            size={16}
            strokeWidth={isActive ? 2 : 1.5}
            className={cn('shrink-0 transition-colors', isActive ? 'text-accent-600' : 'text-ink-400 group-hover:text-ink-600')}
          />
          {!collapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );

  return collapsed ? (
    <Tooltip content={label} side="right" wrapperClassName="block w-full">
      {link}
    </Tooltip>
  ) : (
    link
  );
}
