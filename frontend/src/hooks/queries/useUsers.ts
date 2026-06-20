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

/** Update a user identified at call time (for row actions in a list). */
export function useUpdateUserById() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { name?: string; role?: Role; isActive?: boolean };
    }) => userService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
