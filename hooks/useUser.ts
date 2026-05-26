import { useQuery } from '@tanstack/react-query';
import { getMyInfo } from '@/lib/api/user';

// 내 정보 조회 훅
export const useMyInfo = () => {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: getMyInfo,
    retry: 1,
  });
};
