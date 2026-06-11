import { useMutation } from '@tanstack/react-query';
import { calculateSimulation, SimulationRequest } from '@/lib/api/simulation';

// 대출 시뮬레이션 계산 hook
export const useLoanSimulation = () => {
  return useMutation({
    mutationFn: (data: SimulationRequest) => calculateSimulation(data),
  });
};
