import { useQuery } from '@tanstack/react-query';
import { searchLoans, LoanSearchCondition } from '@/lib/api/loan';

// 대출 상품 검색 hook
export const useLoanSearch = (condition: LoanSearchCondition, enabled = true) => {
  return useQuery({
    queryKey: ['loans', condition],
    queryFn: () => searchLoans(condition),
    enabled, // 조건이 있을 때만 실행
    staleTime: 1000 * 60 * 10, // 10분 (대출 상품은 자주 변하지 않음)
  });
};
