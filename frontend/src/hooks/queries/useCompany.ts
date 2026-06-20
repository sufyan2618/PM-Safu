import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { companyService, type CompanySetupPayload } from '@/api/services/company.service';
import { useAuthStore } from '@/store/authStore';

export function useCompany() {
  return useQuery({ queryKey: ['company', 'me'], queryFn: companyService.me });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  const setCompany = useAuthStore((s) => s.setCompany);
  return useMutation({
    mutationFn: (payload: CompanySetupPayload) => companyService.setup(payload),
    onSuccess: (company) => {
      qc.invalidateQueries({ queryKey: ['company', 'me'] });
      setCompany({
        id: company.id,
        companyName: company.companyName,
        status: company.status,
        isActive: company.isActive,
        onboardingCompleted: company.onboardingCompleted,
        currency: company.currency,
        logoUrl: company.logoUrl,
      });
    },
  });
}
