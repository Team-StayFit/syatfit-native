import { apiClient } from './client';

// 매물 검색 조건
export interface PropertySearchCondition {
  sgg_name: string; // 시/군/구 이름 (예: "마포구")
  umd_name?: string; // 읍/면/동 이름 (예: "합정동")
  transaction_type?: 'TRADING' | 'LEASE' | 'RENT'; // 거래 유형
  max_price?: number; // 최대 가격
  max_monthly_rent?: number; // 최대 월세
  builder?: string; // 건설사 (백엔드는 constructor 사용하지만 JS 예약어 충돌 방지)
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
  builder: string; // constructor는 JS 예약어이므로 builder로 사용
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
  // builder를 constructor로 변환해서 백엔드로 전송 (백엔드는 constructor 사용)
  const requestBody = { ...condition };
  if (requestBody.builder) {
    (requestBody as any).constructor = requestBody.builder;
    delete requestBody.builder;
  }

  const response = await apiClient.post<PropertySearchResult>('/properties/search', requestBody);

  // constructor 필드를 builder로 변환 (JS 예약어 충돌 방지)
  if (response && typeof response === 'object' && 'properties' in response) {
    const result = response as any;
    if (Array.isArray(result.properties)) {
      result.properties = result.properties.map((prop: any) => {
        if (prop.constructor && typeof prop.constructor === 'string') {
          return { ...prop, builder: prop.constructor };
        }
        return prop;
      });
    }
    return result;
  }

  return response as any;
};

// 매물 상세 정보 조회 API
export const getPropertyDetail = async (
  propertyId: number
): Promise<PropertyInfo> => {
  const response = await apiClient.get<PropertyInfo>(`/properties/${propertyId}`);

  // constructor 필드를 builder로 변환 (JS 예약어 충돌 방지)
  if (response && typeof response === 'object') {
    const prop = response as any;
    if (prop.constructor && typeof prop.constructor === 'string') {
      return { ...prop, builder: prop.constructor };
    }
  }

  return response as any;
};
