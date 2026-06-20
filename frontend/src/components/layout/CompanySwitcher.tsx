import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronsUpDown } from 'lucide-react';
import { CompanyBrand } from './CompanyBrand';
import { Dropdown } from '@/components/ui/Dropdown';
import { authService } from '@/api/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/constants/routes.constants';
import { cn } from '@/utils/cn';

interface CompanySwitcherProps {
  collapsed?: boolean;
}

/**
 * Sidebar branding that doubles as a tenant switcher when the signed-in person
 * belongs to more than one company (linked by email across tenants).
 */
export function CompanySwitcher({ collapsed = false }: CompanySwitcherProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const setSession = useAuthStore((s) => s.setSession);
  const currentCompanyId = useAuthStore((s) => s.company?.id);

  const { data: companies } = useQuery({
    queryKey: ['auth', 'my-companies'],
    queryFn: authService.myCompanies,
    staleTime: 5 * 60 * 1000,
  });

  async function handleSwitch(companyId: string) {
    if (companyId === currentCompanyId) return;
    try {
      const result = await authService.switchCompany(companyId);
      setSession({ user: result.user, token: result.accessToken, company: result.company });
      qc.clear();
      navigate(ROUTES.DASHBOARD, { replace: true });
      toast.success(`Switched to ${result.company.companyName}`);
    } catch {
      toast.error('Could not switch company');
    }
  }

  // Nothing to switch between — render plain branding.
  if (!companies || companies.length <= 1) {
    return <CompanyBrand collapsed={collapsed} />;
  }

  return (
    <Dropdown
      align="start"
      className="w-full"
      trigger={
        <button
          type="button"
          className={cn(
            'group flex w-full items-center rounded-xl border border-transparent transition-colors hover:border-subtle hover:bg-sunken',
            collapsed ? 'justify-center p-1.5' : 'gap-2 p-2',
          )}
        >
          <div className={cn(collapsed ? '' : 'flex-1')}>
            <CompanyBrand collapsed={collapsed} />
          </div>
          {!collapsed && (
            <ChevronsUpDown size={16} strokeWidth={1.5} className="shrink-0 text-ink-400" />
          )}
        </button>
      }
      items={companies.map((c) => ({
        label: c.companyName,
        icon: c.isCurrent ? <Check size={16} strokeWidth={2} /> : <span className="w-4" />,
        onClick: () => void handleSwitch(c.id),
      }))}
    />
  );
}
