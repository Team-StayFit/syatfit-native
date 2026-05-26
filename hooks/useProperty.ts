import { useQuery } from '@tanstack/react-query';
import { searchProperties, getPropertyDetail, PropertySearchCondition } from '@/lib/api/property';

// 매물 검색 hook
export const usePropertySearch = (condition: PropertySearchCondition, enabled = true) => {
  return useQuery({
    queryKey: ['properties', condition],
    queryFn: () => searchProperties(condition),
    enabled, // 조건이 있을 때만 실행
    staleTime: 1000 * 60 * 5, // 5분
  });
};

// 매물 상세 조회 hook
export const usePropertyDetail = (propertyId: number | string, enabled = true) => {
  return useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => getPropertyDetail(Number(propertyId)),
    enabled: enabled && !!propertyId, // propertyId가 있을 때만 실행
    staleTime: 1000 * 60 * 5, // 5분
  });
};
