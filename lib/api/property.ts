import { apiClient } from './client';

// 매물 검색 조건
export interface PropertySearchCondition {
  sgg_name: string; // 시/군/구 이름 (예: "마포구")
  umd_name?: string; // 읍/면/동 이름 (예: "합정동")
  transaction_type?: 'TRADING' | 'LEASE' | 'RENT'; // 거래 유형
  max_price?: number; // 최대 가격
  max_monthly_rent?: number; // 최대 월세
  constructor?: string; // 건설사
  min_parking_ratio?: number; // 최소 주차 비율
  exclusive_area?: number; // 전용 면적
  infra_categories?: ('SUBWAY' | 'HOSPITAL' | 'SCHOOL' | 'MART')[]; // 인프라 카테고리
}

// 인프라 상세
export interface InfraDetail {
  category: 'SUBWAY' | 'HOSPITAL' | 'SCHOOL' | 'MART';
  placeName: string;
  distance: number;
}

// 매물 정보
export interface PropertyInfo {
  propertyId: number;
  name: string;
  roadAddress: string;
  transactionType: string;
  price: number;
  monthlyRent: number;
  exclusiveArea: number;
  constructor: string;
  parkingRatio: number;
  infrastructures: InfraDetail[];
}

// 매물 검색 결과
export interface PropertySearchResult {
  totalCount: number;
  properties: PropertyInfo[];
}

// 매물 검색 API
export const searchProperties = async (
  condition: PropertySearchCondition
): Promise<PropertySearchResult> => {
  const response = await apiClient.post<PropertySearchResult>('/properties/search', condition);
  return response as any;
};

// 매물 상세 정보 조회 API
export const getPropertyDetail = async (
  propertyId: number
): Promise<PropertyInfo> => {
  const response = await apiClient.get<PropertyInfo>(`/properties/${propertyId}`);
  return response as any;
};
