import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/api/services/user.service';
import type { QueryParams, Role } from '@/types';
import type { UserInviteFormValues } from '@/constants/validation.constants';

export function useUsers(params: QueryParams = {}) {
  return useQuery({ queryKey: ['users', params], queryFn: () => userService.list(params) });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserInviteFormValues) => userService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name?: string; role?: Role; isActive?: boolean }) =>
      userService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
