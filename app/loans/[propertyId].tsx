import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@/constants/tokens';
import { useLoanSearch } from '@/hooks/useLoan';
import { useLoanSimulation } from '@/hooks/useSimulation';
import { useUserFinance } from '@/hooks/useUserFinance';
import { LoanOption, LoanProduct } from '@/lib/api/loan';
import { calculateLoanSimulationClientSide } from '@/lib/utils/loanSimulation';

const RATE_TYPE_FILTERS = [
  { label: '전체', value: undefined },
  { label: '고정금리', value: 'FIXED' },
  { label: '변동금리', value: 'VARIABLE' },
  { label: '혼합형', value: 'MIXED' },
];

const REPAYMENT_TYPE_FILTERS = [
  { label: '전체', value: undefined },
  { label: '원리금균등', value: 'EQUAL_PRINCIPAL_INTEREST' },
  { label: '원금균등', value: 'EQUAL_PRINCIPAL' },
  { label: '만기일시', value: 'BULLET' },
];

const RATE_TYPE_LABELS: Record<string, string> = {
  FIXED: '고정금리',
  VARIABLE: '변동금리',
  MIXED: '혼합형',
};

const REPAYMENT_TYPE_LABELS: Record<string, string> = {
  EQUAL_PRINCIPAL_INTEREST: '원리금균등분할상환',
  EQUAL_PRINCIPAL: '원금균등분할상환',
  BULLET: '만기일시상환',
};

const translateRateType = (v: string) => RATE_TYPE_LABELS[v] || v;
const translateRepaymentType = (v: string) => REPAYMENT_TYPE_LABELS[v] || v;

// 원 단위 금액을 억/만원 단위로 표시
const formatWon = (amountWon?: number) => {
  if (!amountWon) return '0원';
  const manWon = Math.round(amountWon / 10000);
  const eok = Math.floor(manWon / 10000);
  const man = manWon % 10000;
  if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${man.toLocaleString()}만원`;
};

export default function LoanSearchScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { propertyId, propertyData: propertyDataParam } = params;

  const property = propertyDataParam ? JSON.parse(propertyDataParam as string) : null;

  // 거래 유형에 따른 기본 대출/시뮬레이션 종류 결정
  // 매매(TRADING) → 주택담보대출(MORTGAGE), 전세/월세(LEASE, RENT) → 전세자금대출(RENT)
  const simulationType: 'MORTGAGE' | 'RENT' =
    property?.transactionType === 'TRADING' ? 'MORTGAGE' : 'RENT';

  const [rateType, setRateType] = useState<string | undefined>(undefined);
  const [repaymentType, setRepaymentType] = useState<string | undefined>(undefined);

  const { data, isLoading, error, refetch } = useLoanSearch({
    loan_type: simulationType,
    ...(rateType ? { rate_type: rateType } : {}),
    ...(repaymentType ? { repayment_type: repaymentType } : {}),
  });

  const { mutate: simulate, data: simulationResult, isPending: isSimulating, reset: resetSimulation } = useLoanSimulation();
  const { data: financeData } = useUserFinance();

  // AI 채팅 추천 매물 등 실제 propertyId가 없는 합성 데이터인지 확인
  const numericPropertyId = Number(propertyId);
  const hasRealPropertyId = Number.isFinite(numericPropertyId);

  const [activeKey, setActiveKey] = useState<string | null>(null);

  const handleSelectOption = (product: LoanProduct, option: LoanOption) => {
    const key = `${product.productId}-${option.optionId}`;

    if (activeKey === key) {
      // 같은 옵션을 다시 누르면 결과 닫기
      setActiveKey(null);
      resetSimulation();
      return;
    }

    setActiveKey(key);

    // 실제 propertyId가 없으면 (AI 추천 매물 등) 백엔드 호출 없이 프론트엔드 추정치만 표시
    if (!hasRealPropertyId) {
      resetSimulation();
      return;
    }

    simulate(
      { propertyId: numericPropertyId, optionId: option.optionId, type: simulationType },
      {
        onError: (err) => {
          console.error('대출 시뮬레이션 실패:', err);
          Alert.alert('오류', '대출 시뮬레이션에 실패했습니다. 다시 시도해주세요.');
        },
      }
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>대출 상품 검색</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 매물 요약 */}
        {property && (
          <View style={styles.propertyCard}>
            <Text style={styles.propertyName} numberOfLines={1}>{property.name}</Text>
            <Text style={styles.propertyMeta}>
              {simulationType === 'MORTGAGE' ? '매매가' : '보증금'} {formatWon((property.price || 0) * 10000)}
            </Text>
          </View>
        )}

        {/* 필터 - 금리 방식 */}
        <Text style={styles.filterLabel}>금리 방식</Text>
        <View style={styles.chipRow}>
          {RATE_TYPE_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.label}
              style={[styles.chip, rateType === f.value && styles.chipOn]}
              onPress={() => setRateType(f.value)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, rateType === f.value && styles.chipTextOn]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 필터 - 상환 방식 */}
        <Text style={styles.filterLabel}>상환 방식</Text>
        <View style={styles.chipRow}>
          {REPAYMENT_TYPE_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.label}
              style={[styles.chip, repaymentType === f.value && styles.chipOn]}
              onPress={() => setRepaymentType(f.value)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, repaymentType === f.value && styles.chipTextOn]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 결과 목록 */}
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.navy} />
            <Text style={styles.loadingText}>대출 상품을 불러오는 중...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>대출 상품을 불러오지 못했습니다</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : !data || data.loans.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={styles.emptyText}>조건에 맞는 대출 상품이 없습니다</Text>
            <Text style={styles.emptySub}>필터를 변경해서 다시 검색해보세요</Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultCount}>총 {data.totalCount}개의 대출 상품</Text>
            {data.loans.map((product) => (
              <View key={product.productId} style={styles.productCard}>
                <Text style={styles.bankName}>{product.bankName}</Text>
                <Text style={styles.productName}>{product.productName}</Text>
                {product.loanLimit && (
                  <Text style={styles.loanLimit}>
                    한도 {Number.isFinite(Number(product.loanLimit))
                      ? formatWon(Number(product.loanLimit))
                      : product.loanLimit}
                  </Text>
                )}

                <View style={styles.optionList}>
                  {product.options?.map((option) => {
                    const key = `${product.productId}-${option.optionId}`;
                    const isActive = activeKey === key;
                    return (
                      <View key={key}>
                        <TouchableOpacity
                          style={[styles.optionRow, isActive && styles.optionRowActive]}
                          onPress={() => handleSelectOption(product, option)}
                          activeOpacity={0.75}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.optionTitle}>
                              {translateRateType(option.rateType)} · {translateRepaymentType(option.repaymentType)}
                            </Text>
                            {option.mortgageType && (
                              <Text style={styles.optionSub}>{option.mortgageType}</Text>
                            )}
                          </View>
                          <View style={styles.rateBox}>
                            <Text style={styles.rateValue}>
                              연 {option.lendRateMin?.toFixed(2)}~{option.lendRateMax?.toFixed(2)}%
                            </Text>
                            <Text style={styles.rateAvg}>평균 {option.lendRateAvg?.toFixed(2)}%</Text>
                          </View>
                        </TouchableOpacity>

                        {/* 시뮬레이션 결과 */}
                        {isActive && (
                          <View style={styles.simResultCard}>
                            {hasRealPropertyId && isSimulating ? (
                              <View style={styles.simLoading}>
                                <ActivityIndicator size="small" color={colors.navy} />
                                <Text style={styles.simLoadingText}>시뮬레이션 계산 중...</Text>
                              </View>
                            ) : (() => {
                              // 실제 propertyId가 없거나(AI 추천 매물), 백엔드 시뮬레이션이 아직
                              // 미구현(0/null)인 경우 프론트엔드에서 대략적으로 계산
                              const isStub = !hasRealPropertyId || !simulationResult || !simulationResult.analysis;
                              const result = isStub
                                ? calculateLoanSimulationClientSide({
                                    priceManWon: property?.price || 0,
                                    type: simulationType,
                                    option,
                                    financeData,
                                  })
                                : simulationResult;

                              return (
                                <>
                                  {isStub && (
                                    <Text style={styles.estimateNotice}>
                                      * 서버 계산 준비 중 - 아래는 입력 정보 기반 추정치입니다
                                    </Text>
                                  )}
                                  <View style={[
                                    styles.possibleBadge,
                                    result.isPossible ? styles.possibleOn : styles.possibleOff,
                                  ]}>
                                    <Text style={[
                                      styles.possibleText,
                                      result.isPossible ? styles.possibleTextOn : styles.possibleTextOff,
                                    ]}>
                                      {result.isPossible ? '✓ 대출로 자금 조달 가능' : '⚠ 자금 부족'}
                                    </Text>
                                  </View>

                                  <View style={styles.simRow}>
                                    <Text style={styles.simLabel}>최종 대출 한도</Text>
                                    <Text style={styles.simValue}>{formatWon(result.finalLoanLimit)}</Text>
                                  </View>
                                  <View style={styles.simRow}>
                                    <Text style={styles.simLabel}>필요 자금</Text>
                                    <Text style={styles.simValue}>{formatWon(result.neededAmount)}</Text>
                                  </View>
                                  <View style={styles.simRow}>
                                    <Text style={styles.simLabel}>
                                      {result.gapAmount >= 0 ? '부족 금액' : '여유 자금'}
                                    </Text>
                                    <Text style={[styles.simValue, result.gapAmount > 0 && { color: colors.warn }]}>
                                      {formatWon(Math.abs(result.gapAmount))}
                                    </Text>
                                  </View>
                                  <View style={styles.simRow}>
                                    <Text style={styles.simLabel}>예상 월 상환액</Text>
                                    <Text style={styles.simValue}>{formatWon(result.monthlyRepayment)}</Text>
                                  </View>
                                  <View style={styles.simDivider} />
                                  <View style={styles.simRow}>
                                    <Text style={styles.simLabelSmall}>적용 LTV</Text>
                                    <Text style={styles.simValueSmall}>{result.analysis?.appliedLtv}%</Text>
                                  </View>
                                  <View style={styles.simRow}>
                                    <Text style={styles.simLabelSmall}>DSR</Text>
                                    <Text style={styles.simValueSmall}>{result.analysis?.dsrValue}%</Text>
                                  </View>
                                  <View style={styles.simRow}>
                                    <Text style={styles.simLabelSmall}>한도 기준</Text>
                                    <Text style={styles.simValueSmall}>{result.analysis?.limitSource}</Text>
                                  </View>
                                </>
                              );
                            })()}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: 12,
    backgroundColor: colors.bg,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 0.5, borderColor: colors.border,
  },
  backIcon: { fontSize: 20, color: colors.navy },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.navy, letterSpacing: -0.3 },

  content: { paddingHorizontal: spacing.lg, paddingBottom: 20 },

  propertyCard: {
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
  },
  propertyName: { fontSize: 15, fontWeight: '800', color: colors.white, letterSpacing: -0.3, marginBottom: 4 },
  propertyMeta: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },

  filterLabel: {
    fontSize: 11, fontWeight: '700', color: '#B0B8C4',
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 4,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 0.5, borderColor: '#E2DED6',
    backgroundColor: colors.white,
  },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  chipTextOn: { color: colors.white },

  resultCount: { fontSize: 12, color: colors.muted, marginBottom: 10 },

  productCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 0.5, borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  bankName: { fontSize: 11, fontWeight: '700', color: colors.muted, marginBottom: 2 },
  productName: { fontSize: 15, fontWeight: '800', color: colors.navy, letterSpacing: -0.3, marginBottom: 4 },
  loanLimit: { fontSize: 12, color: colors.mintText, fontWeight: '700', marginBottom: 10 },

  optionList: { gap: 8, marginTop: 4 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionRowActive: { borderColor: colors.navy },
  optionTitle: { fontSize: 12.5, fontWeight: '700', color: colors.navy },
  optionSub: { fontSize: 10.5, color: colors.muted, marginTop: 2 },
  rateBox: { alignItems: 'flex-end' },
  rateValue: { fontSize: 12.5, fontWeight: '800', color: colors.navy },
  rateAvg: { fontSize: 10.5, color: colors.muted, marginTop: 2 },

  simResultCard: {
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 8,
  },
  simLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 },
  simLoadingText: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  estimateNotice: { fontSize: 10.5, color: 'rgba(255,255,255,0.45)', marginBottom: 8 },
  possibleBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    marginBottom: 10,
  },
  possibleOn: { backgroundColor: 'rgba(0,199,140,0.2)' },
  possibleOff: { backgroundColor: 'rgba(208,107,26,0.2)' },
  possibleText: { fontSize: 12, fontWeight: '700' },
  possibleTextOn: { color: colors.mint },
  possibleTextOff: { color: '#FFA766' },
  simRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 5,
  },
  simLabel: { fontSize: 12.5, color: 'rgba(255,255,255,0.65)' },
  simValue: { fontSize: 13, fontWeight: '800', color: colors.white },
  simLabelSmall: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  simValueSmall: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  simDivider: { height: 0.5, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 6 },

  centerBox: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { fontSize: 13, color: colors.muted, marginTop: 12 },
  errorText: { fontSize: 14, fontWeight: '700', color: colors.navy, marginBottom: 14 },
  retryBtn: { backgroundColor: colors.navy, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 24 },
  retryBtnText: { fontSize: 13, fontWeight: '700', color: colors.white },
  emptyText: { fontSize: 14, fontWeight: '700', color: colors.navy, marginBottom: 6 },
  emptySub: { fontSize: 12, color: colors.muted },
});
