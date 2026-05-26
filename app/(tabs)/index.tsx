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

const RECOMMENDED = [
  { id: '1', name: '래미안 퍼스티지', location: '서초구 반포동', price: '13억 5,000', type: '매매', dsr: 37.5, suitable: true },
  { id: '2', name: '파크스테이트 광교', location: '수원시 영통구', price: '전 4억 8,000', type: '전세', dsr: 35.2, suitable: true },
  { id: '3', name: '아크로 서울포레스트', location: '성동구 성수동', price: '18억 2,000', type: '매매', dsr: 41.2, suitable: false },
];

const RECENT = [
  { id: '1', name: '아이디 레스트', location: '마포구 연남동', price: '9억 5,000', type: '매매', suitable: true },
  { id: '2', name: '브라이튼 여의도', location: '영등포구 여의도동', price: '전 3억 2,000', type: '전세', suitable: true },
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
          <FlatList
            horizontal
            data={RECOMMENDED}
            keyExtractor={(i) => i.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hScroll}
            renderItem={({ item }) => <PropertyCard item={item} />}
          />

          {/* Recent */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>최근 본 매물</Text>
            <TouchableOpacity>
              <Text style={styles.sectionMore}>더보기 →</Text>
            </TouchableOpacity>
          </View>
          {RECENT.map((r) => (
            <View key={r.id} style={styles.recentCard}>
              <View style={styles.recentThumb} />
              <View style={styles.recentInfo}>
                <Text style={styles.recentName}>{r.name}</Text>
                <Text style={styles.recentLoc}>{r.location} · {r.type}</Text>
              </View>
              <View style={styles.recentRight}>
                <Text style={styles.recentPrice}>{r.price}</Text>
                {r.suitable && <Text style={styles.suitTag}>✓ 적합</Text>}
              </View>
            </View>
          ))}

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function PropertyCard({ item }: { item: typeof RECOMMENDED[0] }) {
  return (
    <TouchableOpacity
      style={styles.propCard}
      activeOpacity={0.85}
      onPress={() => router.push(`/property/${item.id}`)}
    >
      <View style={styles.propImg}>
        <View style={styles.propTag}>
          <Text style={styles.propTagText}>{item.type}</Text>
        </View>
        {item.suitable ? (
          <View style={styles.propFit}>
            <Text style={styles.propFitText}>✓ 적합</Text>
          </View>
        ) : (
          <View style={[styles.propFit, { backgroundColor: '#FFF0EB' }]}>
            <Text style={[styles.propFitText, { color: colors.warn }]}>DSR 주의</Text>
          </View>
        )}
      </View>
      <View style={styles.propBody}>
        <Text style={styles.propName}>{item.name}</Text>
        <Text style={styles.propLoc}>{item.location}</Text>
        <Text style={styles.propPrice}>{item.price}</Text>
        <Text style={styles.propDsr}>DSR {item.dsr}%</Text>
      </View>
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
  },
  recentThumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#DDE3EF' },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 13, fontWeight: '700', color: colors.navy, letterSpacing: -0.2 },
  recentLoc: { fontSize: 11, color: colors.muted, marginTop: 2 },
  recentRight: { alignItems: 'flex-end' },
  recentPrice: { fontSize: 13, fontWeight: '800', color: colors.navy, letterSpacing: -0.3 },
  suitTag: { fontSize: 10, color: colors.mint, fontWeight: '700', marginTop: 2 },
});
