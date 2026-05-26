import { apiClient } from './client';

// 재무 정보 타입 정의 (snake_case로 BE와 매칭)
export interface UserFinanceData {
  capital: number; // 보유 자산
  annual_income: number; // 연 소득
  total_debt_amount: number; // 총 부채
  monthly_repayment: number; // 월 상환액
  is_home_owner: boolean; // 주택 소유 여부
}

export interface UserFinanceResponse {
  user_id: number;
  capital: number;
  annual_income: number;
  total_debt_amount: number;
  monthly_repayment: number;
  is_home_owner: boolean;
}

// 재무 정보 조회
export const getUserFinance = async (): Promise<UserFinanceResponse> => {
  const response = await apiClient.get('/users/me/finance');
  return response;
};

// 재무 정보 저장/수정
export const updateUserFinance = async (
  data: UserFinanceData
): Promise<UserFinanceResponse> => {
  const response = await apiClient.patch('/users/me/finance', data);
  return response;
};
