import { apiClient } from './client';

// 대출 시뮬레이션 요청
export interface SimulationRequest {
  propertyId: number;
  optionId: number;
  type: 'MORTGAGE' | 'RENT';
}

// 대출 시뮬레이션 분석 정보
export interface SimulationAnalysis {
  limitSource: string;
  dsrValue: number;
  appliedLtv: number;
}

// 대출 시뮬레이션 결과
export interface SimulationResult {
  finalLoanLimit: number;
  neededAmount: number;
  gapAmount: number;
  isPossible: boolean;
  monthlyRepayment: number;
  analysis: SimulationAnalysis;
}

// 대출 시뮬레이션 계산 API
export const calculateSimulation = async (
  data: SimulationRequest
): Promise<SimulationResult> => {
  const response = await apiClient.post('/simulations/calculate', data);
  return response as any;
};
