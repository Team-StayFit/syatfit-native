import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserFinance, updateUserFinance, UserFinanceData } from '@/lib/api/userFinance';

// 재무 정보 조회 hook
export const useUserFinance = () => {
  return useQuery({
    queryKey: ['userFinance'],
    queryFn: getUserFinance,
    staleTime: 1000 * 60 * 5, // 5분
  });
};

// 재무 정보 저장/수정 hook
export const useUpdateUserFinance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserFinanceData) => updateUserFinance(data),
    onSuccess: () => {
      // 성공 시 캐시 무효화하여 재조회
      queryClient.invalidateQueries({ queryKey: ['userFinance'] });
    },
  });
};
