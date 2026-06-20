import { Link } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/Spinner';
import { useDashboard } from '@/hooks/queries';
import { formatCompactCurrency, formatCompactNumber } from '@/lib/format';
import type { PlatformStats } from '@/types';

interface Tile {
  key: keyof PlatformStats;
  label: string;
  icon: typeof Building2;
  format: (value: number) => string;
  to?: string;
  accent?: boolean;
}

const TILES: Tile[] = [
  { key: 'totalCompanies', label: 'Total companies', icon: Building2, format: formatCompactNumber, to: '/companies' },
  { key: 'pendingCompanies', label: 'Pending approval', icon: Clock, format: formatCompactNumber, to: '/companies?status=pending', accent: true },
  { key: 'approvedCompanies', label: 'Approved', icon: CheckCircle2, format: formatCompactNumber, to: '/companies?status=approved' },
  { key: 'activeUsers', label: 'Active users', icon: Users, format: formatCompactNumber },
  { key: 'totalInvoices', label: 'Invoices issued', icon: FileText, format: formatCompactNumber },
  { key: 'totalRevenueProcessed', label: 'Revenue processed', icon: TrendingUp, format: (v) => formatCompactCurrency(v) },
];

export function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) return <PageLoader />;

  if (isError || !data) {
    return (
      <Card>
        <p className="text-body-sm text-danger-600">
          Unable to load platform statistics. Please refresh and try again.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-sm text-ink-900">Overview</h1>
        <p className="mt-1 text-body-sm text-ink-600">
          Platform-wide activity across every tenant company.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          const value = tile.format(data[tile.key]);
          const content = (
            <Card hoverable={Boolean(tile.to)} className="h-full">
              <div className="flex items-start justify-between">
                <span
                  className={
                    tile.accent
                      ? 'flex h-9 w-9 items-center justify-center rounded-lg bg-warn-100 text-warn-600'
                      : 'flex h-9 w-9 items-center justify-center rounded-lg bg-sunken text-ink-600'
                  }
                >
                  <Icon size={18} strokeWidth={1.5} />
                </span>
              </div>
              <p className="mt-4 font-data text-data-lg text-ink-900">{value}</p>
              <p className="mt-1 text-body-sm text-ink-600">{tile.label}</p>
            </Card>
          );
          return tile.to ? (
            <Link key={tile.key} to={tile.to} className="block">
              {content}
            </Link>
          ) : (
            <div key={tile.key}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
