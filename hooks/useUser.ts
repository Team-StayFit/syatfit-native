import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyInfo, updateMyInfo, deleteMyAccount, UpdateUserRequest } from '@/lib/api/user';

// 내 정보 조회 훅
export const useMyInfo = () => {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: getMyInfo,
    retry: 1,
  });
};

// 내 정보 수정 훅
export const useUpdateMyInfo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserRequest) => updateMyInfo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });
};

// 회원 탈퇴 훅
export const useDeleteAccount = () => {
  return useMutation({
    mutationFn: () => deleteMyAccount(),
  });
};
