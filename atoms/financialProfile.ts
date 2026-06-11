import { atom } from 'jotai';
import { UserFinanceData } from '@/lib/api/userFinance';

export interface FinancialProfileState {
  income: number;
  assets: number;
  debt: number;
  regions: string[];
  // 로그인 전(토큰 없음) 입력된 재무 정보. 로그인 성공 직후 백엔드에 저장된다.
  pendingFinance?: UserFinanceData;
}

export const financialProfileAtom = atom<FinancialProfileState>({
  income: 0,
  assets: 0,
  debt: 0,
  regions: [],
});
