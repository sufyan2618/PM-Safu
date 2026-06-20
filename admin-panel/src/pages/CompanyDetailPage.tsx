import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import {
  ArrowLeft,
  Ban,
  Check,
  Globe,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  X,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageLoader, Spinner } from '@/components/ui/Spinner';
import { StatusPill, ActivePill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useApproveCompany,
  useCompany,
  useCompanyUsers,
  useReactivateCompany,
  useRejectCompany,
  useSuspendCompany,
} from '@/hooks/queries';
import { useToast } from '@/hooks/useToast';
import { formatDate, formatDateTime } from '@/lib/format';
import type { Address } from '@/types';

const ROLE_LABELS: Record<string, string> = {
  company_admin: 'Company admin',
  hr_manager: 'HR manager',
  accountant: 'Accountant',
  staff: 'Staff',
};

function formatAddress(address?: Address): string | null {
  if (!address) return null;
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-ink-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-caption uppercase tracking-[0.02em] text-ink-400">{label}</p>
        <p className="text-body-sm text-ink-900">{value}</p>
      </div>
    </div>
  );
}

export function CompanyDetailPage() {
  const { id = '' } = useParams();
  const toast = useToast();

  const { data, isLoading, isError } = useCompany(id);
  const { data: users, isLoading: usersLoading } = useCompanyUsers(id);

  const approve = useApproveCompany(id);
  const reject = useRejectCompany(id);
  const suspend = useSuspendCompany(id);
  const reactivate = useReactivateCompany(id);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  const busy =
    approve.isPending || reject.isPending || suspend.isPending || reactivate.isPending;

  const onError = (error: unknown, fallback: string) => {
    const message =
      error instanceof AxiosError ? (error.response?.data?.message ?? fallback) : fallback;
    toast.error(message);
  };

  const handleApprove = () => {
    approve.mutate(id, {
      onSuccess: () => toast.success('Company approved', 'They can now sign in and onboard.'),
      onError: (e) => onError(e, 'Failed to approve company'),
    });
  };

  const handleReject = () => {
    if (reason.trim().length < 3) {
      setReasonError('Please provide a reason (at least 3 characters).');
      return;
    }
    reject.mutate(
      { id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success('Company rejected');
          setRejectOpen(false);
          setReason('');
        },
        onError: (e) => onError(e, 'Failed to reject company'),
      },
    );
  };

  const handleSuspend = () => {
    suspend.mutate(id, {
      onSuccess: () => toast.success('Company suspended', 'Their users can no longer sign in.'),
      onError: (e) => onError(e, 'Failed to suspend company'),
    });
  };

  const handleReactivate = () => {
    reactivate.mutate(id, {
      onSuccess: () => toast.success('Company reactivated'),
      onError: (e) => onError(e, 'Failed to reactivate company'),
    });
  };

  if (isLoading) return <PageLoader />;

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Card>
          <p className="text-body-sm text-danger-600">Company not found or failed to load.</p>
        </Card>
      </div>
    );
  }

  const { company, userCount } = data;
  const address = formatAddress(company.address);

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          {company.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={company.companyName}
              className="h-14 w-14 rounded-xl border border-subtle object-cover"
            />
          ) : (
            <span
              className="flex h-14 w-14 items-center justify-center rounded-xl text-heading font-semibold text-white"
              style={{ backgroundColor: company.brandColor ?? 'var(--accent-600)' }}
            >
              {company.companyName.charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <h1 className="text-display-sm text-ink-900">{company.companyName}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusPill status={company.status} />
              <ActivePill isActive={company.isActive} />
              {company.onboardingCompleted ? (
                <span className="text-caption text-ink-400">Onboarding complete</span>
              ) : (
                <span className="text-caption text-ink-400">Onboarding pending</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {company.status === 'pending' && (
            <>
              <Button
                onClick={handleApprove}
                isLoading={approve.isPending}
                disabled={busy}
                leftIcon={<Check size={16} />}
              >
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => setRejectOpen(true)}
                disabled={busy}
                leftIcon={<X size={16} />}
              >
                Reject
              </Button>
            </>
          )}
          {company.status === 'approved' &&
            (company.isActive ? (
              <Button
                variant="destructive"
                onClick={handleSuspend}
                isLoading={suspend.isPending}
                disabled={busy}
                leftIcon={<Ban size={16} />}
              >
                Suspend
              </Button>
            ) : (
              <Button
                onClick={handleReactivate}
                isLoading={reactivate.isPending}
                disabled={busy}
                leftIcon={<RotateCcw size={16} />}
              >
                Reactivate
              </Button>
            ))}
        </div>
      </div>

      {company.status === 'rejected' && company.rejectionReason && (
        <Card className="border-danger-600/40 bg-danger-100/40">
          <p className="text-caption uppercase tracking-[0.02em] text-danger-600">Rejection reason</p>
          <p className="mt-1 text-body-sm text-ink-900">{company.rejectionReason}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Company details" ruled />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <DetailRow
              icon={<Mail size={16} strokeWidth={1.5} />}
              label="Registration email"
              value={company.registrationEmail}
            />
            {company.legalName && (
              <DetailRow
                icon={<Mail size={16} strokeWidth={1.5} />}
                label="Legal name"
                value={company.legalName}
              />
            )}
            {company.industry && (
              <DetailRow
                icon={<Globe size={16} strokeWidth={1.5} />}
                label="Industry"
                value={company.industry}
              />
            )}
            {company.phone && (
              <DetailRow
                icon={<Phone size={16} strokeWidth={1.5} />}
                label="Phone"
                value={company.phone}
              />
            )}
            {company.website && (
              <DetailRow
                icon={<Globe size={16} strokeWidth={1.5} />}
                label="Website"
                value={company.website}
              />
            )}
            <DetailRow
              icon={<Globe size={16} strokeWidth={1.5} />}
              label="Currency"
              value={company.currency}
            />
            {company.taxId && (
              <DetailRow
                icon={<Globe size={16} strokeWidth={1.5} />}
                label="Tax ID"
                value={company.taxId}
              />
            )}
            {address && (
              <DetailRow
                icon={<MapPin size={16} strokeWidth={1.5} />}
                label="Address"
                value={address}
              />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Timeline" ruled />
          <div className="space-y-4">
            <DetailRow
              icon={<span className="block h-2 w-2 rounded-full bg-ink-400" />}
              label="Registered"
              value={formatDateTime(company.createdAt)}
            />
            {company.reviewedAt && (
              <DetailRow
                icon={<span className="block h-2 w-2 rounded-full bg-accent-600" />}
                label="Reviewed"
                value={formatDateTime(company.reviewedAt)}
              />
            )}
            <DetailRow
              icon={<span className="block h-2 w-2 rounded-full bg-ink-400" />}
              label="Last updated"
              value={formatDate(company.updatedAt)}
            />
          </div>
        </Card>
      </div>

      <Card padded={false}>
        <div className="p-5">
          <CardHeader title={`Team members (${userCount})`} ruled />
        </div>
        {usersLoading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner size={20} />
          </div>
        ) : !users || users.length === 0 ? (
          <EmptyState title="No users yet" description="This company has not added any team members." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-subtle text-caption uppercase tracking-[0.02em] text-ink-400">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Last login</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-subtle last:border-0">
                    <td className="px-5 py-3.5">
                      <p className="text-body-sm font-medium text-ink-900">{user.name}</p>
                      <p className="text-caption text-ink-400">{user.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-body-sm text-ink-600">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </td>
                    <td className="px-5 py-3.5">
                      <ActivePill isActive={user.isActive} />
                    </td>
                    <td className="px-5 py-3.5 text-body-sm text-ink-600">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={rejectOpen}
        onClose={() => {
          if (reject.isPending) return;
          setRejectOpen(false);
          setReasonError(null);
        }}
        title="Reject company"
        description="The company will be notified with the reason below."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setRejectOpen(false)}
              disabled={reject.isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} isLoading={reject.isPending}>
              Confirm rejection
            </Button>
          </>
        }
      >
        <label className="mb-1.5 block text-caption font-medium uppercase tracking-[0.02em] text-ink-600">
          Reason
        </label>
        <textarea
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setReasonError(null);
          }}
          rows={4}
          placeholder="Explain why this registration is being rejected…"
          className="w-full resize-none rounded-lg border border-strong bg-surface px-3 py-2 text-body text-ink-900 placeholder:text-ink-400 focus:border-accent-600 focus:outline-none focus:ring-1 focus:ring-accent-600"
        />
        {reasonError && <p className="mt-1.5 text-caption text-danger-600">{reasonError}</p>}
      </Modal>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/companies"
      className="inline-flex items-center gap-1.5 text-body-sm text-ink-600 transition-colors hover:text-ink-900"
    >
      <ArrowLeft size={16} strokeWidth={1.5} />
      Back to companies
    </Link>
  );
}
