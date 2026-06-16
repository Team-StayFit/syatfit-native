import { apiClient } from './client';

// 대출 검색 조건
export interface LoanSearchCondition {
  loan_type: string; // 대출 종류 (필수, 예: 'MORTGAGE' | 'RENT')
  bank_name?: string; // 은행명
  rate_type?: string; // 금리 방식 (예: 'FIXED' | 'VARIABLE' | 'MIXED')
  repayment_type?: string; // 상환 방식 (예: 'EQUAL_PRINCIPAL_INTEREST' | 'EQUAL_PRINCIPAL' | 'BULLET')
  mortgage_type?: string; // 담보 유형
}

// 대출 옵션 정보
export interface LoanOption {
  optionId: number;
  repaymentType: string;
  rateType: string;
  lendRateMin: number;
  lendRateMax: number;
  lendRateAvg: number;
  mortgageType: string;
}

// 대출 상품 정보
export interface LoanProduct {
  productId: string;
  bankName: string;
  productName: string;
  loanType: string;
  loanLimit: string;
  options: LoanOption[];
}

// 대출 검색 결과
export interface LoanSearchResult {
  totalCount: number;
  loans: LoanProduct[];
}

// 대출 상품 검색 API
export const searchLoans = async (
  condition: LoanSearchCondition
): Promise<LoanSearchResult> => {
  const response = await apiClient.post('/loans/search', condition);
  return response as any;
};
