import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSetAtom } from 'jotai';
import { colors, radius, spacing } from '@/constants/tokens';
import { useMyInfo } from '@/hooks/useUser';
import { useUserFinance } from '@/hooks/useUserFinance';
import { clearAuthData } from '@/lib/utils/tokenStorage';
import { queryClient } from '@/lib/queryClient';
import { financialProfileAtom } from '@/atoms/financialProfile';
import { useFavoriteProperties, useToggleFavorite } from '@/hooks/useFavorite';

const SETTINGS = [
  { icon: '🔔', label: '알림 설정', sub: '시세 변동·추천 업데이트' },
  { icon: '✏️', label: '재무 정보 수정', sub: '소득·자산·부채·희망 지역' },
  { icon: '🔒', label: '개인정보 처리방침' },
  { icon: '📄', label: '이용약관' },
];

export default function MyScreen() {
  const insets = useSafeAreaInsets();

  // API 호출: 사용자 정보
  const { data: userInfo, isLoading: userLoading } = useMyInfo();

  // API 호출: 재무 정보
  const { data: financeData, isLoading: financeLoading } = useUserFinance();

  // API 호출: 관심 매물 목록
  const { data: favoriteProperties = [], isLoading: favoritesLoading } = useFavoriteProperties();

  // 재무 점수 계산 (홈 화면과 동일한 로직)
  const calculateScore = () => {
    if (!financeData) return 0;
    const income = financeData.annual_income || 0;
    const asset = financeData.capital || 0;
    const debt = financeData.total_debt_amount || 0;

    const assetScore = Math.min((asset / 100000000) * 30, 50); // 최대 50점
    const incomeScore = Math.min((income / 50000000) * 30, 30); // 최대 30점
    const debtPenalty = Math.min((debt / asset) * 20, 20); // 최대 -20점

    return Math.round(assetScore + incomeScore - debtPenalty + 20);
  };

  const score = calculateScore();

  // 재무 데이터 포맷팅
  const formatIncome = (income?: number) => {
    if (!income) return '미입력';
    return `${Math.floor(income / 10000)}만원`;
  };

  const formatAsset = (asset?: number) => {
    if (!asset) return '0';
    const eok = Math.floor(asset / 100000000);
    const man = Math.floor((asset % 100000000) / 10000);
    if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만`;
    if (eok > 0) return `${eok}억`;
    return `${man.toLocaleString()}만`;
  };

  // LTV, DSR, 구매예산 계산
  const calculateFinancialMetrics = () => {
    if (!financeData) return { ltv: 0, dsr: 0, budget: 0 };

    const income = financeData.annual_income || 0;
    const asset = financeData.capital || 0;
    const debt = financeData.total_debt_amount || 0;

    // LTV: 보통 70% (고정값)
    const ltv = 70;

    // DSR: (연간 대출 상환액 / 연소득) * 100
    // 간단한 계산: 자산 대비 부채 비율로 대략 계산
    const dsr = income > 0 ? Math.min((debt / income) * 100, 100) : 0;

    // 구매 예산: 자산 + (연소득 * 10 * 0.7) - 부채
    // 연소득 10배의 70% LTV로 대출 가능하다고 가정
    const budget = asset + (income * 10 * 0.7) - debt;

    return {
      ltv: Math.round(ltv),
      dsr: Math.round(dsr * 10) / 10,
      budget: Math.floor(budget / 100000000 * 10) / 10, // 억 단위로 변환
    };
  };

  const metrics = calculateFinancialMetrics();

  const setFinancialProfile = useSetAtom(financialProfileAtom);

  // 로그아웃 핸들러
  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            await clearAuthData();
            // 이전 사용자의 캐시 데이터(내 정보, 재무 정보, 찜 목록 등)가
            // 다음 로그인 사용자에게 잠깐이라도 보이지 않도록 초기화
            queryClient.clear();
            setFinancialProfile({ income: 0, assets: 0, debt: 0, regions: [], pendingFinance: undefined });
            router.replace('/onboarding/login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 22 }}>👤</Text>
            </View>
            <View style={styles.profileInfo}>
              {userLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Text style={styles.profileName}>
                    {userInfo?.nickname || userInfo?.username || '사용자'}
                  </Text>
                  <Text style={styles.profileEmail}>
                    {userInfo?.email || '이메일 없음'}
                  </Text>
                </>
              )}
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push('/profile/edit')}
              activeOpacity={0.7}
            >
              <Text style={styles.editBtnText}>편집</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.body}>
          {/* Financial Summary */}
          <View style={styles.sectionLabel}>
            <Text style={styles.sectionLabelText}>재무 체력</Text>
          </View>
          {financeLoading ? (
            <View style={styles.finCard}>
              <ActivityIndicator size="large" color={colors.navy} />
              <Text style={styles.loadingText}>재무 정보 불러오는 중...</Text>
            </View>
          ) : (
            <View style={styles.finCard}>
              <View style={styles.finTop}>
                <View>
                  <Text style={styles.finScoreLabel}>현재 점수</Text>
                  <View style={styles.finScoreRow}>
                    <Text style={styles.finScore}>{score}</Text>
                    <Text style={styles.finScoreMax}> / 100</Text>
                  </View>
                </View>
                <View style={styles.finBadge}>
                  <Text style={styles.finBadgeText}>
                    {score >= 70 ? '양호' : score >= 50 ? '보통' : '주의'}
                  </Text>
                </View>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${score}%` }]} />
              </View>
              <View style={styles.finStats}>
                {[
                  { label: '연소득', value: formatIncome(financeData?.annual_income) },
                  { label: '보유자산', value: formatAsset(financeData?.capital) },
                  { label: '현재부채', value: formatAsset(financeData?.total_debt_amount) },
                ].map((s) => (
                  <View key={s.label} style={styles.finStatItem}>
                    <Text style={styles.finStatLabel}>{s.label}</Text>
                    <Text style={styles.finStatValue}>{s.value}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={styles.updateBtn}
                onPress={() => router.push('/onboarding/financial-profile')}
                activeOpacity={0.8}
              >
                <Text style={styles.updateBtnText}>재무 정보 업데이트</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* DSR / LTV chips */}
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaVal}>LTV {metrics.ltv}%</Text>
              <Text style={styles.metaLbl}>대출 한도</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={[styles.metaVal, { color: metrics.dsr < 40 ? colors.mint : colors.warn }]}>
                DSR {metrics.dsr}%
              </Text>
              <Text style={styles.metaLbl}>상환 비율</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={[styles.metaVal, { color: colors.mintText }]}>
                {metrics.budget.toFixed(1)}억
              </Text>
              <Text style={styles.metaLbl}>구매 예산</Text>
            </View>
          </View>

          {/* Saved properties */}
          <View style={styles.sectionLabel}>
            <Text style={styles.sectionLabelText}>관심 매물</Text>
            {favoriteProperties.length > 0 && (
              <TouchableOpacity>
                <Text style={styles.sectionMore}>전체보기 →</Text>
              </TouchableOpacity>
            )}
          </View>
          {favoritesLoading ? (
            <View style={styles.emptyCard}>
              <ActivityIndicator size="large" color={colors.navy} />
              <Text style={styles.loadingText}>관심 매물을 불러오는 중...</Text>
            </View>
          ) : favoriteProperties.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>관심 매물이 없습니다</Text>
              <Text style={styles.emptySub}>매물을 둘러보고 마음에 드는 곳을 저장해보세요</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push('/(tabs)/properties')}
              >
                <Text style={styles.emptyBtnText}>매물 탐색하기</Text>
              </TouchableOpacity>
            </View>
          ) : (
            favoriteProperties.slice(0, 3).map((property) => (
              <SavedPropertyCard key={property.propertyId} property={property} />
            ))
          )}

          {/* Settings */}
          <View style={[styles.sectionLabel, { marginTop: 8 }]}>
            <Text style={styles.sectionLabelText}>설정</Text>
          </View>
          <View style={styles.settingsCard}>
            {SETTINGS.map((s, i) => (
              <React.Fragment key={s.label}>
                <TouchableOpacity
                  style={styles.settingRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (s.label === '재무 정보 수정') {
                      router.push('/onboarding/financial-profile');
                    }
                    // TODO: 다른 설정 항목 추가
                  }}
                >
                  <Text style={styles.settingIcon}>{s.icon}</Text>
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>{s.label}</Text>
                    {s.sub && <Text style={styles.settingSub}>{s.sub}</Text>}
                  </View>
                  <Text style={styles.settingArrow}>›</Text>
                </TouchableOpacity>
                {i < SETTINGS.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>

          <Text style={styles.version}>v1.0.0</Text>
          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </View>
  );
}

// 관심 매물 카드 컴포넌트
function SavedPropertyCard({ property }: { property: any }) {
  const { mutate: toggleFavorite, isPending: isTogglingFavorite } = useToggleFavorite();

  // 가격 포맷팅: 만원 단위 → 억/만원 표시
  const formatPrice = (priceManWon: number) => {
    if (!priceManWon || priceManWon === 0) return '0';
    const eok = Math.floor(priceManWon / 10000);
    const man = priceManWon % 10000;
    if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만`;
    if (eok > 0) return `${eok}억`;
    return `${man.toLocaleString()}만`;
  };

  // 거래 유형에 따른 가격 표시
  const getPriceDisplay = () => {
    if (property.transactionType === 'RENT') {
      const monthly = formatPrice(property.monthlyRent);
      if (property.price && property.price > 0) {
        const deposit = formatPrice(property.price);
        return `${deposit} / 월 ${monthly}`;
      }
      return `월세 ${monthly}`;
    } else if (property.transactionType === 'LEASE') {
      return `전세 ${formatPrice(property.price)}`;
    } else {
      return `매매 ${formatPrice(property.price)}`;
    }
  };

  // 거래 유형 한글 변환
  const getTypeLabel = (type: string) => {
    if (type === 'TRADING') return '매매';
    if (type === 'LEASE') return '전세';
    if (type === 'RENT') return '월세';
    return type;
  };

  // 찜 해제 핸들러
  const handleToggleFavorite = (e: any) => {
    e.stopPropagation();
    if (isTogglingFavorite) return;

    Alert.alert(
      '찜 해제',
      '이 매물을 관심 목록에서 제거하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '해제',
          style: 'destructive',
          onPress: () => {
            toggleFavorite(
              { propertyId: Number(property.propertyId), isFavorite: true },
              {
                onError: (error) => {
                  console.error('찜 해제 실패:', error);
                  Alert.alert('오류', '찜 해제에 실패했습니다. 다시 시도해주세요.');
                },
              }
            );
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.savedCard}
      onPress={() =>
        router.push({
          pathname: `/property/${property.propertyId}`,
          params: { propertyData: JSON.stringify(property) },
        })
      }
      activeOpacity={0.8}
    >
      <View style={styles.savedThumb} />
      <View style={styles.savedInfo}>
        <Text style={styles.savedName}>{property.name}</Text>
        <Text style={styles.savedLoc}>
          {property.roadAddress} · {getTypeLabel(property.transactionType)}
        </Text>
        <Text style={styles.savedPrice}>{getPriceDisplay()}</Text>
      </View>
      <TouchableOpacity
        style={styles.heartBtn}
        onPress={handleToggleFavorite}
        disabled={isTogglingFavorite}
      >
        <Text style={{ fontSize: 16 }}>{isTogglingFavorite ? '⏳' : '❤️'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.lg, paddingBottom: 24,
  },
  profileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '800', color: colors.white, letterSpacing: -0.4 },
  profileEmail: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  editBtn: {
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
  },
  editBtnText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

  body: { paddingHorizontal: spacing.lg, paddingTop: 20 },

  sectionLabel: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  sectionLabelText: { fontSize: 13, fontWeight: '800', color: colors.navy, letterSpacing: -0.2 },
  sectionMore: { fontSize: 12, color: colors.muted },

  finCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl, padding: spacing.lg,
    borderWidth: 0.5, borderColor: colors.border,
    marginBottom: 10,
  },
  finTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 12,
  },
  finScoreLabel: { fontSize: 10, fontWeight: '700', color: colors.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  finScoreRow: { flexDirection: 'row', alignItems: 'baseline' },
  finScore: { fontSize: 44, fontWeight: '800', color: colors.navy, letterSpacing: -2, lineHeight: 48 },
  finScoreMax: { fontSize: 14, color: '#D0D4DC' },
  finBadge: {
    backgroundColor: colors.mintLight, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  finBadgeText: { fontSize: 12, fontWeight: '700', color: colors.mintText },
  progressBg: {
    height: 5, backgroundColor: '#EDE9E2',
    borderRadius: 3, marginBottom: 16, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.mint, borderRadius: 3 },
  finStats: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  finStatItem: {
    flex: 1, backgroundColor: colors.cardBg,
    borderRadius: 10, padding: 10, alignItems: 'center',
  },
  finStatLabel: { fontSize: 9.5, color: colors.muted, marginBottom: 3 },
  finStatValue: { fontSize: 12, fontWeight: '800', color: colors.navy, letterSpacing: -0.3 },
  updateBtn: {
    backgroundColor: colors.navy, borderRadius: radius.md,
    padding: 13, alignItems: 'center',
  },
  updateBtnText: { fontSize: 13, fontWeight: '700', color: colors.white },

  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  metaChip: {
    flex: 1, backgroundColor: colors.white,
    borderRadius: 12, padding: 12, alignItems: 'center',
    borderWidth: 0.5, borderColor: colors.border,
  },
  metaVal: { fontSize: 13, fontWeight: '800', color: colors.navy, letterSpacing: -0.3 },
  metaLbl: { fontSize: 9.5, color: colors.muted, marginTop: 2 },

  savedCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: 13, flexDirection: 'row', alignItems: 'center',
    gap: 12, marginBottom: 9,
    borderWidth: 0.5, borderColor: colors.border,
  },
  savedThumb: { width: 54, height: 54, borderRadius: 12, backgroundColor: '#DDE3EF' },
  savedInfo: { flex: 1 },
  savedName: { fontSize: 13, fontWeight: '700', color: colors.navy, letterSpacing: -0.2 },
  savedLoc: { fontSize: 11, color: colors.muted, marginTop: 2 },
  savedPrice: { fontSize: 13, fontWeight: '800', color: colors.navy, marginTop: 4, letterSpacing: -0.3 },
  heartBtn: { padding: 8 },

  settingsCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    borderWidth: 0.5, borderColor: colors.border,
    marginBottom: 12, overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 15, paddingHorizontal: 16, gap: 12,
  },
  settingIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  settingText: { flex: 1 },
  settingLabel: { fontSize: 14, fontWeight: '600', color: colors.navy },
  settingSub: { fontSize: 11, color: colors.muted, marginTop: 2 },
  settingArrow: { fontSize: 20, color: colors.muted },
  divider: { height: 0.5, backgroundColor: colors.border, marginLeft: 52 },

  logoutBtn: {
    borderWidth: 0.5, borderColor: '#E2DED6',
    borderRadius: radius.md, padding: 14,
    alignItems: 'center', marginBottom: 10,
  },
  logoutText: { fontSize: 14, color: colors.muted, fontWeight: '600' },

  version: { textAlign: 'center', fontSize: 11, color: '#D0D4DC', marginTop: 4 },

  loadingText: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 12,
    textAlign: 'center',
  },

  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 32,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.border,
    marginBottom: 22,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyBtn: {
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
});
