import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFavoriteProperties, addFavorite, removeFavorite, checkFavorite } from '@/lib/api/favorite';

// 찜한 매물 목록 조회
export const useFavoriteProperties = () => {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: getFavoriteProperties,
    staleTime: 1000 * 60 * 5, // 5분
    retry: false, // 백엔드 API 미구현으로 재시도 비활성화
    enabled: false, // 백엔드 API 미구현으로 비활성화
  });
};

// 찜 여부 확인
export const useCheckFavorite = (propertyId: number | string) => {
  return useQuery({
    queryKey: ['favorite', propertyId],
    queryFn: () => checkFavorite(Number(propertyId)),
    enabled: false, // 백엔드 API 미구현으로 비활성화
    retry: false, // 백엔드 API 미구현으로 재시도 비활성화
    staleTime: 1000 * 60 * 5, // 5분
  });
};

// 찜 토글 (추가/삭제)
export const useToggleFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, isFavorite }: { propertyId: number; isFavorite: boolean }) => {
      if (isFavorite) {
        await removeFavorite(propertyId);
      } else {
        await addFavorite(propertyId);
      }
    },
    onSuccess: (_, variables) => {
      // 찜 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      // 해당 매물의 찜 상태 새로고침
      queryClient.invalidateQueries({ queryKey: ['favorite', variables.propertyId] });
    },
  });
};
