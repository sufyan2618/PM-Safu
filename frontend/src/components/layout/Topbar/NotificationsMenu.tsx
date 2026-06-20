import { Bell } from 'lucide-react';
import { Dropdown } from '@/components/ui/Dropdown';
import { IconButton } from '@/components/ui/IconButton';

const NOTIFICATIONS = [
  { label: 'Invoice INV-1043 was paid', meta: '2h ago' },
  { label: 'Payroll run for June is ready', meta: '5h ago' },
  { label: 'Cobalt Systems is 6 days overdue', meta: '1d ago' },
];

export function NotificationsMenu() {
  return (
    <Dropdown
      align="end"
      trigger={
        <span className="relative inline-flex">
          <IconButton label="Notifications" icon={<Bell size={18} strokeWidth={1.5} />} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger-600 ring-2 ring-surface" />
        </span>
      }
      items={NOTIFICATIONS.map((n) => ({
        label: `${n.label}`,
        onClick: () => undefined,
      }))}
    />
  );
}
