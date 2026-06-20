import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown } from '@/components/ui/Dropdown';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes.constants';
import { ROLE_LABELS } from '@/constants/roles.constants';

export function UserMenu() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  if (!user) return null;

  return (
    <Dropdown
      align="end"
      trigger={
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-sunken"
        >
          <Avatar name={user.name} src={user.avatarUrl} size="sm" />
          <span className="hidden text-left lg:block">
            <span className="block text-body-sm font-medium leading-tight text-ink-900">
              {user.name}
            </span>
            <span className="block text-caption leading-tight text-ink-400">
              {ROLE_LABELS[user.role]}
            </span>
          </span>
          <ChevronDown size={15} strokeWidth={1.5} className="text-ink-400" />
        </button>
      }
      items={[
        {
          label: 'Profile',
          icon: <UserIcon size={16} strokeWidth={1.5} />,
          onClick: () => navigate(ROUTES.SETTINGS_PROFILE),
        },
        {
          label: 'Sign out',
          icon: <LogOut size={16} strokeWidth={1.5} />,
          tone: 'danger',
          onClick: () => void signOut(),
        },
      ]}
    />
  );
}
