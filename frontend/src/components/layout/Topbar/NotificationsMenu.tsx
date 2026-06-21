import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, BellOff } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/utils/cn';
import { useClickOutside } from '@/hooks/useClickOutside';
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '@/hooks/queries/useNotifications';

const TYPE_ICON: Record<string, string> = {
  invoice_paid: '💰',
  invoice_overdue: '⚠️',
  payroll_finalized: '✅',
  salary_slip_sent: '📄',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useClickOutside(ref, () => setOpen(false), open);

  const { data, isLoading } = useNotifications();
  const markAll = useMarkAllNotificationsRead();
  const markOne = useMarkNotificationRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  function handleItemClick(id: string, link: string) {
    setOpen(false);
    markOne.mutate(id);
    navigate(link);
  }

  return (
    <div className="relative inline-flex" ref={ref}>
      <span className="relative inline-flex">
        <IconButton
          label="Notifications"
          icon={<Bell size={18} strokeWidth={1.5} />}
          onClick={() => setOpen((o) => !o)}
        />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-600 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-surface">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </span>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-lg border border-subtle bg-surface shadow-popover">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
            <span className="text-body-sm font-semibold text-ink-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="flex items-center gap-1 text-caption text-accent-600 transition-colors hover:text-accent-700 disabled:opacity-50"
              >
                <CheckCheck size={13} strokeWidth={2} />
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-0 divide-y divide-subtle">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 px-4 py-3">
                    <div className="mt-0.5 h-7 w-7 animate-pulse rounded-full bg-sunken" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-3/4 animate-pulse rounded bg-sunken" />
                      <div className="h-2.5 w-full animate-pulse rounded bg-sunken" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <BellOff size={28} strokeWidth={1.5} className="text-ink-300" />
                <p className="text-body-sm text-ink-400">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-subtle">
                {notifications.map((n) => (
                  <button
                    key={n._id}
                    type="button"
                    onClick={() => handleItemClick(n._id, n.link)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-sunken',
                      !n.isRead && 'bg-accent-50',
                    )}
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sunken text-sm">
                      {TYPE_ICON[n.type] ?? '🔔'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            'text-body-sm leading-snug',
                            n.isRead ? 'font-normal text-ink-600' : 'font-semibold text-ink-900',
                          )}
                        >
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent-600" />
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-caption text-ink-400">{n.body}</p>
                      <p className="mt-1 text-caption text-ink-300">{timeAgo(n.createdAt)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
