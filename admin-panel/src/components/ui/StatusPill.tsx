import { Badge, type BadgeTone } from './Badge';
import type { CompanyStatus } from '@/types';

const STATUS_TONE: Record<CompanyStatus, BadgeTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

const STATUS_LABEL: Record<CompanyStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export function StatusPill({ status }: { status: CompanyStatus }) {
  return (
    <Badge tone={STATUS_TONE[status]} dot>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export function ActivePill({ isActive }: { isActive: boolean }) {
  return (
    <Badge tone={isActive ? 'neutral' : 'danger'} dot>
      {isActive ? 'Active' : 'Suspended'}
    </Badge>
  );
}
