import { atom } from 'jotai';

export interface FinancialProfileState {
  income: number;
  assets: number;
  debt: number;
  regions: string[];
}

export const financialProfileAtom = atom<FinancialProfileState>({
  income: 0,
  assets: 0,
  debt: 0,
  regions: [],
});
