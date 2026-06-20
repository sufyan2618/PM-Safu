import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { formatCurrency } from '@/utils/formatCurrency';
import { ROUTES } from '@/constants/routes.constants';
import type { OutstandingClient } from '@/types';

export function OutstandingPaymentsList({ clients }: { clients: OutstandingClient[] }) {
  if (clients.length === 0) {
    return <p className="py-6 text-center text-body-sm text-ink-400">No outstanding balances.</p>;
  }
  return (
    <ul className="divide-y divide-subtle">
      {clients.map((client) => (
        <li key={client.clientId}>
          <Link
            to={ROUTES.CLIENT_DETAIL(client.clientId)}
            className="flex items-center gap-3 py-3 transition-colors hover:bg-sunken/50"
          >
            <Avatar name={client.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm font-medium text-ink-900">{client.name}</p>
              <p className="truncate text-caption text-ink-400">
                {client.companyName ?? 'Outstanding balance'}
              </p>
            </div>
            <span className="font-data text-body-sm font-medium text-danger-600">
              {formatCurrency(client.outstanding)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
