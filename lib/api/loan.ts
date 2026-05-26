import { apiClient } from './client';

// 대출 검색 조건
export interface LoanSearchCondition {
  property_price?: number; // 부동산 가격
  annual_income?: number; // 연 소득
  total_debt?: number; // 총 부채
  is_first_home?: boolean; // 생애 첫 주택 여부
  finance_group?: string; // 금융 그룹
}

// 대출 상품 정보
export interface LoanProductInfo {
  loan_product_id: number;
  product_name: string;
  finance_company: string;
  interest_rate_min: number;
  interest_rate_max: number;
  max_ltv: number;
  max_loan_amount: number;
}

// 대출 검색 결과
export interface LoanSearchResult {
  total_count: number;
  loan_products: LoanProductInfo[];
}

// 대출 상품 검색 API
export const searchLoans = async (
  condition: LoanSearchCondition
): Promise<LoanSearchResult> => {
  const response = await apiClient.post('/loans/search', condition);
  return response;
};
