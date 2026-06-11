import { useQuery } from '@tanstack/react-query';
import { searchProperties, getPropertyDetail, PropertySearchCondition } from '@/lib/api/property';
import { getRecentProperties } from '@/lib/utils/recentProperties';
import { useState, useEffect } from 'react';

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
    enabled: false, // 백엔드 API 미구현으로 비활성화
    retry: false, // 백엔드 API 미구현으로 재시도 비활성화
    staleTime: 1000 * 60 * 5, // 5분
  });
};

// 최근 본 매물 목록 조회 hook
export const useRecentProperties = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRecent = async () => {
      setIsLoading(true);
      const items = await getRecentProperties();
      console.log('🔍 유효한 최근 본 매물 개수:', items.length);
      setProperties(items);
      setIsLoading(false);
    };

    loadRecent();
  }, []);

  return { properties, isLoading };
};
