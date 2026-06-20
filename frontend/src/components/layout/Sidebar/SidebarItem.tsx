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
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-body-sm font-medium transition-colors',
          collapsed && 'justify-center px-0',
          isActive
            ? 'bg-accent-100 text-accent-600'
            : 'text-ink-600 hover:bg-sunken hover:text-ink-900',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-accent-600" />
          )}
          <Icon size={18} strokeWidth={1.5} className="shrink-0" />
          {!collapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );

  return collapsed ? (
    <Tooltip content={label} side="right">
      {link}
    </Tooltip>
  ) : (
    link
  );
}
