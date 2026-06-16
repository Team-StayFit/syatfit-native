import type { LoanOption } from '@/lib/api/loan';
import type { SimulationResult } from '@/lib/api/simulation';
import type { UserFinanceResponse } from '@/lib/api/userFinance';

// DSR 산정 시 적용하는 한도 (대략 40%)
const DSR_LIMIT = 0.4;

interface ClientSimulationInput {
  priceManWon: number; // 매매가 / 전세보증금 (만원)
  type: 'MORTGAGE' | 'RENT';
  option: LoanOption;
  financeData?: UserFinanceResponse;
}

// 월 상환액 -> 대출 가능 원금 환산 (상환 방식별)
function principalFromMonthlyPayment(monthly: number, monthlyRate: number, termMonths: number, isBullet: boolean, isEqualPrincipal: boolean) {
  if (monthly <= 0) return 0;
  if (monthlyRate === 0) {
    return isBullet ? Infinity : monthly * termMonths;
  }
  if (isBullet) return monthly / monthlyRate;
  if (isEqualPrincipal) return monthly / (1 / termMonths + monthlyRate);
  const factor = Math.pow(1 + monthlyRate, termMonths);
  return (monthly * (factor - 1)) / (monthlyRate * factor);
}

// 대출 원금 -> 월 상환액 환산 (상환 방식별, 첫 회차 기준)
function monthlyPaymentFromPrincipal(principal: number, monthlyRate: number, termMonths: number, isBullet: boolean, isEqualPrincipal: boolean) {
  if (principal <= 0) return 0;
  if (monthlyRate === 0) {
    return isBullet ? 0 : principal / termMonths;
  }
  if (isBullet) return principal * monthlyRate;
  if (isEqualPrincipal) return principal / termMonths + principal * monthlyRate;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

// 백엔드 시뮬레이션이 미구현 상태(0/null)일 때 프론트엔드에서 대략적으로 계산하는 fallback
export function calculateLoanSimulationClientSide({
  priceManWon,
  type,
  option,
  financeData,
}: ClientSimulationInput): SimulationResult {
  const price = priceManWon * 10000; // 원 단위
  const annualIncome = financeData?.annual_income || 0;
  const capital = financeData?.capital || 0;
  const existingMonthlyRepayment = financeData?.monthly_repayment || 0;
  const isHomeOwner = financeData?.is_home_owner || false;

  // LTV 한도 (대략): 매매 - 무주택 70% / 유주택 60%, 전세자금대출 80%
  const ltvLimit = type === 'RENT' ? 0.8 : isHomeOwner ? 0.6 : 0.7;
  const ltvBasedLimit = Math.round(price * ltvLimit);

  // 대출 기간 (대략): 주택담보대출 30년, 전세자금대출 2년
  const termMonths = type === 'RENT' ? 24 : 360;
  const monthlyRate = (option.lendRateAvg ?? option.lendRateMin ?? 0) / 100 / 12;

  const repaymentLabel = option.repaymentType || '';
  const isBullet = repaymentLabel.includes('만기일시');
  const isEqualPrincipal = repaymentLabel.includes('원금균등');

  // DSR 한도 내 월 상환 가능액 -> 대출 가능 원금
  const maxAnnualRepayment = Math.max(annualIncome * DSR_LIMIT - existingMonthlyRepayment * 12, 0);
  const dsrBasedLimitRaw = principalFromMonthlyPayment(maxAnnualRepayment / 12, monthlyRate, termMonths, isBullet, isEqualPrincipal);
  const dsrBasedLimit = Number.isFinite(dsrBasedLimitRaw) ? Math.round(dsrBasedLimitRaw) : ltvBasedLimit;

  const finalLoanLimit = Math.max(0, Math.min(ltvBasedLimit, dsrBasedLimit));
  const limitSource = finalLoanLimit >= dsrBasedLimit ? 'DSR 기준 (추정)' : 'LTV 기준 (추정)';

  // 필요 자금 = 매매가/전세보증금 - 보유 자산 (최소 0)
  const neededAmount = Math.max(price - capital, 0);
  const gapAmount = neededAmount - finalLoanLimit;
  const isPossible = gapAmount <= 0;

  const monthlyRepayment = Math.round(monthlyPaymentFromPrincipal(finalLoanLimit, monthlyRate, termMonths, isBullet, isEqualPrincipal));
  const appliedLtv = price > 0 ? Math.round((finalLoanLimit / price) * 1000) / 10 : 0;
  const totalAnnualRepayment = existingMonthlyRepayment * 12 + monthlyRepayment * 12;
  const dsrValue = annualIncome > 0 ? Math.round((totalAnnualRepayment / annualIncome) * 1000) / 10 : 0;

  return {
    finalLoanLimit,
    neededAmount,
    gapAmount,
    isPossible,
    monthlyRepayment,
    analysis: {
      limitSource,
      dsrValue,
      appliedLtv,
    },
  };
}
