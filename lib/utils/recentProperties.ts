import * as SecureStore from 'expo-secure-store';

const RECENT_PROPERTIES_KEY = 'stayfit_recentProperties';
const MAX_RECENT = 10; // 최대 10개까지 저장

export interface RecentPropertyItem {
  propertyId: number;
  name: string;
  roadAddress: string;
  transactionType: string;
  price: number;
  monthlyRent: number;
  exclusiveArea?: number;
  builder?: string;
  parkingRatio?: number;
  infrastructures?: any[];
  viewedAt: number; // timestamp
}

// 최근 본 매물 목록 조회
export const getRecentProperties = async (): Promise<RecentPropertyItem[]> => {
  try {
    const stored = await SecureStore.getItemAsync(RECENT_PROPERTIES_KEY);
    if (!stored) {
      console.log('📋 최근 본 매물: 저장된 데이터 없음');
      return [];
    }

    const items: RecentPropertyItem[] = JSON.parse(stored);
    console.log('📋 최근 본 매물 로드 (정리 전):', items);

    // 유효한 데이터만 필터링 (propertyId, name, roadAddress, price가 있는 것만)
    const validItems = items.filter(
      (item) => item.propertyId && item.name && item.roadAddress && item.price
    );

    // 잘못된 데이터가 있었다면 정리된 데이터로 다시 저장
    if (validItems.length !== items.length) {
      console.log('🧹 잘못된 데이터 정리:', items.length - validItems.length, '개 제거');
      await SecureStore.setItemAsync(RECENT_PROPERTIES_KEY, JSON.stringify(validItems));
    }

    // 최신순 정렬 (viewedAt 내림차순)
    return validItems.sort((a, b) => b.viewedAt - a.viewedAt);
  } catch (error) {
    console.error('Failed to get recent properties:', error);
    return [];
  }
};

// 최근 본 매물에 추가
export const addRecentProperty = async (property: any): Promise<void> => {
  try {
    const stored = await SecureStore.getItemAsync(RECENT_PROPERTIES_KEY);
    let items: RecentPropertyItem[] = stored ? JSON.parse(stored) : [];

    // 기존에 있으면 제거 (중복 방지)
    items = items.filter((item) => item.propertyId !== property.propertyId);

    // 새 항목 추가 (맨 앞에)
    items.unshift({
      propertyId: property.propertyId,
      name: property.name,
      roadAddress: property.roadAddress,
      transactionType: property.transactionType,
      price: property.price,
      monthlyRent: property.monthlyRent || 0,
      exclusiveArea: property.exclusiveArea,
      builder: property.builder,
      parkingRatio: property.parkingRatio,
      infrastructures: property.infrastructures || [],
      viewedAt: Date.now(),
    });

    // 최대 개수 제한
    if (items.length > MAX_RECENT) {
      items = items.slice(0, MAX_RECENT);
    }

    await SecureStore.setItemAsync(RECENT_PROPERTIES_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to add recent property:', error);
  }
};

// 최근 본 매물 전체 삭제
export const clearRecentProperties = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(RECENT_PROPERTIES_KEY);
  } catch (error) {
    console.error('Failed to clear recent properties:', error);
  }
};
