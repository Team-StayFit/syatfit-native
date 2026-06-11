import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, radius, spacing } from '@/constants/tokens';
import { useUserFinance } from '@/hooks/useUserFinance';
import { useMyInfo } from '@/hooks/useUser';
import { useCheckFavorite, useToggleFavorite } from '@/hooks/useFavorite';
import { usePropertySearch, useRecentProperties } from '@/hooks/useProperty';

// API 형식에 맞춘 mock 데이터
const RECOMMENDED = [
  {
    propertyId: 1,
    name: '래미안 퍼스티지',
    roadAddress: '서울시 서초구 반포동 123-45',
    transactionType: 'TRADING',
    price: 135000, // 만원 단위
    monthlyRent: 0,
    exclusiveArea: 84.5,
    builder: '삼성물산',
    parkingRatio: 120,
    infrastructures: [
      { category: 'SUBWAY', placeName: '신반포역', distance: 350 },
    ],
  },
  {
    propertyId: 2,
    name: '파크스테이트 광교',
    roadAddress: '경기도 수원시 영통구',
    transactionType: 'LEASE',
    price: 48000,
    monthlyRent: 0,
    exclusiveArea: 59.5,
    builder: '대우건설',
    parkingRatio: 150,
    infrastructures: [],
  },
  {
    propertyId: 3,
    name: '아크로 서울포레스트',
    roadAddress: '서울시 성동구 성수동',
    transactionType: 'TRADING',
    price: 182000,
    monthlyRent: 0,
    exclusiveArea: 114.2,
    builder: '대림산업',
    parkingRatio: 130,
    infrastructures: [],
  },
];

const RECENT = [
  {
    propertyId: 4,
    name: '아이디 레스트',
    roadAddress: '서울시 마포구 연남동',
    transactionType: 'TRADING',
    price: 95000,
    monthlyRent: 0,
    exclusiveArea: 84.0,
    builder: '현대건설',
    parkingRatio: 110,
    infrastructures: [],
  },
  {
    propertyId: 5,
    name: '브라이튼 여의도',
    roadAddress: '서울시 영등포구 여의도동',
    transactionType: 'LEASE',
    price: 32000,
    monthlyRent: 0,
    exclusiveArea: 49.5,
    builder: 'GS건설',
    parkingRatio: 100,
    infrastructures: [],
  },
];

export default function HomeScreen() {
  // API 호출: 사용자 정보 조회
  const { data: userInfo, isLoading: userLoading, error: userError } = useMyInfo();

  // 디버깅 로그
  console.log('👤 사용자 정보:', userInfo);
  console.log('👤 로딩 상태:', userLoading);
  console.log('👤 에러:', userError);

  // API 호출: 재무 정보 조회
  const { data: financeData, isLoading: financeLoading } = useUserFinance();

  // API 호출: 추천 매물 (마포구 기준)
  const { data: recommendedData, isLoading: recommendedLoading } = usePropertySearch({
    sgg_name: '마포구',
  });

  // 최근 본 매물 목록
  const { properties: recentProperties, isLoading: recentLoading } = useRecentProperties();

  // 재무 데이터 포맷팅
  const formatIncome = (income?: number) => {
    if (!income) return '미입력';
    return `${Math.floor(income / 10000)}만원`;
  };

  const formatAsset = (asset?: number) => {
    if (!asset) return '0';
    const eok = Math.floor(asset / 100000000);
    const man = Math.floor((asset % 100000000) / 10000);
    if (eok > 0 && man > 0) return `${eok}억 ${man}만`;
    if (eok > 0) return `${eok}억`;
    return `${man}만`;
  };

  // 간단한 점수 계산 (임시)
  const calculateScore = () => {
    if (!financeData) return 0;
    const income = financeData.annual_income || 0;
    const asset = financeData.capital || 0;
    const debt = financeData.total_debt_amount || 0;

    // 간단한 로직: 자산이 많고 부채가 적으면 높은 점수
    const assetScore = Math.min((asset / 100000000) * 30, 50); // 최대 50점
    const incomeScore = Math.min((income / 50000000) * 30, 30); // 최대 30점
    const debtPenalty = Math.min((debt / asset) * 20, 20); // 최대 -20점

    return Math.round(assetScore + incomeScore - debtPenalty + 20);
  };

  const score = calculateScore();

  // 추천 매물: API 데이터 or mock 데이터
  const recommendedProperties = recommendedData?.properties?.slice(0, 3) || RECOMMENDED;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <SafeAreaView>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greet}>좋은 아침이에요 ☀️</Text>
                <Text style={styles.headerName}>
                  {userInfo?.nickname || userInfo?.username || '사용자'}님의 재무 체력
                </Text>
              </View>
              <TouchableOpacity style={styles.bellBtn}>
                <Text style={{ fontSize: 20 }}>🔔</Text>
                <View style={styles.bellBadge} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          {/* Financial Fitness Card */}
          {financeLoading ? (
            <View style={styles.fitnessCard}>
              <ActivityIndicator size="large" color={colors.navy} />
              <Text style={styles.loadingText}>재무 정보 불러오는 중...</Text>
            </View>
          ) : (
            <View style={styles.fitnessCard}>
              <View style={styles.fitnessTop}>
                <Text style={styles.fitnessLabel}>재무 체력 점수</Text>
                <View style={styles.fitnessBadge}>
                  <Text style={styles.fitnessBadgeText}>
                    {score >= 70 ? '양호' : score >= 50 ? '보통' : '주의'}
                  </Text>
                </View>
              </View>
              <View style={styles.scoreRow}>
                <Text style={styles.score}>{score}</Text>
                <Text style={styles.scoreTotal}> / 100</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${score}%` }]} />
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{formatIncome(financeData?.annual_income)}</Text>
                  <Text style={styles.statLbl}>연소득</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{formatAsset(financeData?.capital)}</Text>
                  <Text style={styles.statLbl}>보유자산</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{formatAsset(financeData?.total_debt_amount)}</Text>
                  <Text style={styles.statLbl}>부채</Text>
                </View>
              </View>
            </View>
          )}

          {/* AI Banner */}
          <TouchableOpacity
            style={styles.aiBanner}
            onPress={() => router.push('/(tabs)/chat')}
            activeOpacity={0.88}
          >
            <View style={styles.aiBannerLeft}>
              <View style={styles.aiTag}>
                <Text style={styles.aiTagText}>AI 탐색</Text>
              </View>
              <Text style={styles.aiTitle}>어떤 집을 찾고 계세요?</Text>
              <Text style={styles.aiSub}>일상 언어로 편하게 말해보세요</Text>
            </View>
            <View style={styles.aiBtn}>
              <Text style={styles.aiBtnText}>탐색하기</Text>
            </View>
          </TouchableOpacity>

          {/* Recommended */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>추천 매물</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/properties')}>
              <Text style={styles.sectionMore}>전체보기 →</Text>
            </TouchableOpacity>
          </View>
          {recommendedLoading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.navy} />
            </View>
          ) : (
            <FlatList
              horizontal
              data={recommendedProperties}
              keyExtractor={(i) => i.propertyId.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScroll}
              renderItem={({ item }) => <PropertyCard item={item} />}
            />
          )}

          {/* Recent */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>최근 본 매물</Text>
            <TouchableOpacity>
              <Text style={styles.sectionMore}>더보기 →</Text>
            </TouchableOpacity>
          </View>
          {recentLoading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.navy} />
            </View>
          ) : recentProperties.length === 0 ? (
            <View style={styles.emptyRecent}>
              <Text style={styles.emptyRecentText}>최근 본 매물이 없습니다</Text>
              <Text style={styles.emptyRecentSub}>매물을 둘러보고 마음에 드는 곳을 확인해보세요</Text>
            </View>
          ) : (
            recentProperties.map((r, idx) => (
              <RecentCard key={r.propertyId || `recent-${idx}`} item={r} />
            ))
          )}

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function PropertyCard({ item }: { item: typeof RECOMMENDED[0] }) {
  // 찜 상태 조회 및 토글
  const { data: isFavorite = false } = useCheckFavorite(item.propertyId);
  const { mutate: toggleFavorite, isPending: isTogglingFavorite } = useToggleFavorite();

  // 가격 포맷팅
  const formatPrice = (priceManWon: number) => {
    if (!priceManWon || priceManWon === 0) return '가격 미정';
    const eok = Math.floor(priceManWon / 10000);
    const man = priceManWon % 10000;
    if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만`;
    if (eok > 0) return `${eok}억`;
    return `${man.toLocaleString()}만`;
  };

  // 거래 유형 한글
  const getTypeLabel = (type: string) => {
    if (type === 'TRADING') return '매매';
    if (type === 'LEASE') return '전세';
    if (type === 'RENT') return '월세';
    return type;
  };

  // 찜 토글 핸들러
  const handleToggleFavorite = (e: any) => {
    e.stopPropagation(); // 카드 클릭 방지
    if (isTogglingFavorite) return;

    toggleFavorite(
      { propertyId: item.propertyId, isFavorite },
      {
        onError: (error) => {
          console.error('찜 토글 실패:', error);
        },
      }
    );
  };

  return (
    <TouchableOpacity
      style={styles.propCard}
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: `/property/${item.propertyId}`,
          params: { propertyData: JSON.stringify(item) },
        })
      }
    >
      <View style={styles.propImg}>
        <View style={styles.propTag}>
          <Text style={styles.propTagText}>{getTypeLabel(item.transactionType)}</Text>
        </View>
        <TouchableOpacity
          onPress={handleToggleFavorite}
          disabled={isTogglingFavorite}
          style={styles.propFavoriteBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.propFavoriteIcon}>
            {isTogglingFavorite ? '⏳' : isFavorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.propBody}>
        <Text style={styles.propName}>{item.name}</Text>
        <Text style={styles.propLoc}>{item.roadAddress}</Text>
        <Text style={styles.propPrice}>{formatPrice(item.price)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function RecentCard({ item }: { item: typeof RECENT[0] }) {
  // 찜 상태 조회 및 토글
  const { data: isFavorite = false } = useCheckFavorite(item.propertyId);
  const { mutate: toggleFavorite, isPending: isTogglingFavorite } = useToggleFavorite();

  // 가격 포맷팅
  const formatPrice = (priceManWon: number) => {
    if (!priceManWon || priceManWon === 0) return '가격 미정';
    const eok = Math.floor(priceManWon / 10000);
    const man = priceManWon % 10000;
    if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만`;
    if (eok > 0) return `${eok}억`;
    return `${man.toLocaleString()}만`;
  };

  // 거래 유형 한글
  const getTypeLabel = (type: string) => {
    if (type === 'TRADING') return '매매';
    if (type === 'LEASE') return '전세';
    if (type === 'RENT') return '월세';
    return type;
  };

  // 찜 토글 핸들러
  const handleToggleFavorite = (e: any) => {
    e.stopPropagation(); // 카드 클릭 방지
    if (isTogglingFavorite) return;

    toggleFavorite(
      { propertyId: item.propertyId, isFavorite },
      {
        onError: (error) => {
          console.error('찜 토글 실패:', error);
        },
      }
    );
  };

  return (
    <TouchableOpacity
      style={styles.recentCard}
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: `/property/${item.propertyId}`,
          params: { propertyData: JSON.stringify(item) },
        })
      }
    >
      <View style={styles.recentThumb} />
      <View style={styles.recentInfo}>
        <Text style={styles.recentName}>{item.name || '매물 이름 없음'}</Text>
        <Text style={styles.recentLoc}>
          {item.roadAddress || '주소 없음'} · {getTypeLabel(item.transactionType || 'TRADING')}
        </Text>
      </View>
      <View style={styles.recentRight}>
        <Text style={styles.recentPrice}>{formatPrice(item.price)}</Text>
      </View>
      <TouchableOpacity
        onPress={handleToggleFavorite}
        disabled={isTogglingFavorite}
        style={styles.recentFavoriteBtn}
        activeOpacity={0.7}
      >
        <Text style={styles.recentFavoriteIcon}>
          {isTogglingFavorite ? '⏳' : isFavorite ? '❤️' : '🤍'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header: { backgroundColor: colors.navy, paddingHorizontal: spacing.lg, paddingBottom: 66 },
  headerTop: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', paddingTop: 8,
  },
  greet: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 4 },
  headerName: { fontSize: 22, fontWeight: '800', color: colors.white, letterSpacing: -0.5 },
  bellBtn: {
    width: 38, height: 38,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 8, height: 8, backgroundColor: '#FF5757', borderRadius: 4,
  },

  body: { paddingHorizontal: spacing.lg, marginTop: -50 },

  fitnessCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  fitnessTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 10,
  },
  fitnessLabel: {
    fontSize: 11, fontWeight: '700', color: colors.muted,
    letterSpacing: 0.6, textTransform: 'uppercase',
  },
  fitnessBadge: {
    backgroundColor: colors.mintLight,
    borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4,
  },
  fitnessBadgeText: { fontSize: 11, fontWeight: '700', color: colors.mintText },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  score: { fontSize: 56, fontWeight: '800', color: colors.navy, letterSpacing: -3, lineHeight: 60 },
  scoreTotal: { fontSize: 15, color: '#D0D4DC' },
  progressBg: {
    height: 6, backgroundColor: '#EDE9E2', borderRadius: 3,
    marginBottom: 16, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.mint, borderRadius: 3 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statItem: {
    flex: 1, backgroundColor: colors.cardBg,
    borderRadius: 12, padding: 10, alignItems: 'center',
  },
  statVal: { fontSize: 14, fontWeight: '800', color: colors.navy, marginBottom: 2, letterSpacing: -0.3 },
  statLbl: { fontSize: 10, color: colors.muted },
  loadingText: { fontSize: 13, color: colors.muted, marginTop: 12, textAlign: 'center' },

  aiBanner: {
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  aiBannerLeft: { flex: 1 },
  aiTag: {
    backgroundColor: colors.mint, borderRadius: 5,
    paddingHorizontal: 7, paddingVertical: 3,
    alignSelf: 'flex-start', marginBottom: 8,
  },
  aiTagText: { fontSize: 10, fontWeight: '700', color: colors.white, letterSpacing: 0.5 },
  aiTitle: { fontSize: 15, fontWeight: '700', color: colors.white, letterSpacing: -0.3, marginBottom: 3 },
  aiSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  aiBtn: {
    backgroundColor: colors.white, borderRadius: 11,
    paddingHorizontal: 14, paddingVertical: 11, marginLeft: 12,
  },
  aiBtnText: { fontSize: 12, fontWeight: '800', color: colors.navy },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.navy, letterSpacing: -0.3 },
  sectionMore: { fontSize: 12, color: colors.muted },

  hScroll: {
    gap: 12, paddingRight: 18,
    marginLeft: -spacing.lg, paddingLeft: spacing.lg, marginBottom: 24,
  },
  propCard: {
    width: 155, backgroundColor: colors.white,
    borderRadius: radius.lg, overflow: 'hidden',
    borderWidth: 0.5, borderColor: colors.border,
  },
  propImg: { height: 106, backgroundColor: '#DDE3EF', position: 'relative' },
  propTag: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: colors.navy, borderRadius: 4,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  propTagText: { fontSize: 10, fontWeight: '700', color: colors.white },
  propFavoriteBtn: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12,
    width: 24, height: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  propFavoriteIcon: { fontSize: 12 },
  propFit: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: colors.mintLight, borderRadius: 4,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  propFitText: { fontSize: 10, fontWeight: '700', color: colors.mintText },
  propBody: { padding: 11 },
  propName: { fontSize: 13, fontWeight: '700', color: colors.navy, marginBottom: 2, letterSpacing: -0.2 },
  propLoc: { fontSize: 11, color: colors.muted, marginBottom: 8 },
  propPrice: { fontSize: 13, fontWeight: '800', color: colors.navy, letterSpacing: -0.3 },
  propDsr: { fontSize: 10, color: colors.mint, fontWeight: '700', marginTop: 1 },

  recentCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md, padding: 14,
    flexDirection: 'row', alignItems: 'center',
    gap: 12, marginBottom: 10,
    borderWidth: 0.5, borderColor: colors.border,
    position: 'relative',
  },
  recentThumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#DDE3EF' },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 13, fontWeight: '700', color: colors.navy, letterSpacing: -0.2 },
  recentLoc: { fontSize: 11, color: colors.muted, marginTop: 2 },
  recentRight: { alignItems: 'flex-end' },
  recentPrice: { fontSize: 13, fontWeight: '800', color: colors.navy, letterSpacing: -0.3 },
  suitTag: { fontSize: 10, color: colors.mint, fontWeight: '700', marginTop: 2 },
  recentFavoriteBtn: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12,
    width: 24, height: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  recentFavoriteIcon: { fontSize: 12 },

  emptyRecent: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 32,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.border,
    marginBottom: 10,
  },
  emptyRecentText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 4,
  },
  emptyRecentSub: {
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
  },
});
