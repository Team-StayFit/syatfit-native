import { apiClient } from './client';
import { PropertyInfo } from './property';

// 찜한 매물 목록 조회
export const getFavoriteProperties = async (): Promise<PropertyInfo[]> => {
  const response = await apiClient.get<PropertyInfo[]>('/favorites');
  return response as any;
};

// 찜 추가
export const addFavorite = async (propertyId: number): Promise<void> => {
  await apiClient.post('/favorites', { property_id: propertyId });
};

// 찜 삭제
export const removeFavorite = async (propertyId: number): Promise<void> => {
  await apiClient.delete(`/favorites/${propertyId}`);
};

// 찜 여부 확인
export const checkFavorite = async (propertyId: number): Promise<boolean> => {
  try {
    const response = await apiClient.get<{ is_favorite: boolean }>(`/favorites/check/${propertyId}`);
    return (response as any).is_favorite;
  } catch {
    return false;
  }
};
