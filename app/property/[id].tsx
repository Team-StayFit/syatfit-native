import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Dimensions, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@/constants/tokens';
import { useUserFinance } from '@/hooks/useUserFinance';
import { usePropertyDetail } from '@/hooks/useProperty';
import { useCheckFavorite, useToggleFavorite } from '@/hooks/useFavorite';
import { addRecentProperty } from '@/lib/utils/recentProperties';
import PropertyImagePlaceholder from '@/components/PropertyImagePlaceholder';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PropertyDetailScreen() {
  const params = useLocalSearchParams();
  const { id, propertyData: propertyDataParam } = params;
  const insets = useSafeAreaInsets();

  // URL 파라미터로 전달받은 매물 데이터 파싱
  const passedPropertyData = propertyDataParam
    ? JSON.parse(propertyDataParam as string)
    : null;

  // AI 채팅 추천 매물 등 실제 propertyId가 없는 합성 데이터인지 확인
  const numericId = Number(id);
  const hasRealPropertyId = Number.isFinite(numericId);

  // 재무 정보 가져오기 (DSR 계산용)
  const { data: financeData } = useUserFinance();

  // 매물 상세 정보 API 호출 (백엔드 미구현으로 비활성화됨)
  const { data: propertyData, isLoading, error } = usePropertyDetail(id as string);

  // 찜 상태 조회 및 토글
  const { data: isFavorite = false } = useCheckFavorite(id as string);
  const { mutate: toggleFavorite, isPending: isTogglingFavorite } = useToggleFavorite();

  // 임시 데이터 (API 데이터가 없을 경우)
  const mockProperty = {
    id,
    name: '래미안 퍼스티지',
    roadAddress: '서울시 서초구 반포동 123-45',
    transactionType: 'TRADING',
    price: 135000, // 만원 단위
    monthlyRent: 0,
    exclusiveArea: 84.5,
    parkingRatio: 120,
    builder: '삼성물산', // constructor는 JS 예약어이므로 builder로 변경
    completionYear: 2021,
    totalFloors: 25,
    floor: 15,
    households: 450,
    infrastructures: [
      { category: 'SUBWAY', placeName: '신반포역 (9호선)', distance: 350 },
      { category: 'SCHOOL', placeName: '반포초등학교', distance: 450 },
      { category: 'HOSPITAL', placeName: '서울성모병원', distance: 1200 },
      { category: 'MART', placeName: '이마트', distance: 600 },
    ],
  };

  // 우선순위: 파라미터로 전달받은 데이터 > API 데이터 > mock 데이터
  const rawProperty = passedPropertyData || propertyData || mockProperty;

  // 주변 인프라 중복 제거 (같은 장소명+카테고리는 하나만)
  const property = {
    ...rawProperty,
    infrastructures: rawProperty.infrastructures
      ? Array.from(
          new Map(
            rawProperty.infrastructures.map((infra: any) => [
              `${infra.category}-${infra.placeName}`,
              infra,
            ])
          ).values()
        )
      : [],
  };

  // 최근 본 매물에 추가 (propertyId가 있을 때만)
  useEffect(() => {
    if (property && property.propertyId) {
      console.log('📌 최근 본 매물 저장:', property);
      addRecentProperty(property);
    }
  }, [property.propertyId]);

  // 로딩 상태 (파라미터로 데이터를 받았으면 로딩 표시 안 함)
  if (isLoading && !passedPropertyData) {
    return (
      <View style={[styles.root, styles.centerContainer]}>
        <ActivityIndicator size="large" color={colors.navy} />
        <Text style={styles.loadingText}>매물 정보를 불러오는 중...</Text>
      </View>
    );
  }

  // 에러 상태 (파라미터로 데이터를 받았으면 에러 무시)
  if (error && !propertyData && !passedPropertyData) {
    return (
      <View style={[styles.root, styles.centerContainer]}>
        <Text style={styles.errorText}>❌ 매물 정보를 불러올 수 없습니다</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.retryBtnText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 가격 포맷팅
  const formatPrice = (priceManWon: number) => {
    if (!priceManWon || priceManWon === 0) return '0';
    const eok = Math.floor(priceManWon / 10000);
    const man = priceManWon % 10000;
    if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만원`;
    if (eok > 0) return `${eok}억원`;
    return `${man.toLocaleString()}만원`;
  };

  // 거래 유형 한글 변환
  const getTypeLabel = (type: string) => {
    if (type === 'TRADING') return '매매';
    if (type === 'LEASE') return '전세';
    if (type === 'RENT') return '월세';
    return type;
  };

  // 간단한 DSR 계산 (실제로는 더 복잡함)
  const calculateDSR = () => {
    if (!financeData?.annual_income || !property.price) return null;

    const annualIncome = financeData.annual_income;
    const loanAmount = property.price * 10000 * 0.7; // 70% LTV 가정
    const loanRate = 0.04; // 4% 금리 가정
    const annualRepayment = (loanAmount * loanRate) / (1 - Math.pow(1 + loanRate, -30));

    const dsr = (annualRepayment / annualIncome) * 100;
    return Math.round(dsr * 10) / 10;
  };

  const dsr = calculateDSR();
  const isDsrSafe = dsr ? dsr < 40 : null;

  // 찜 토글 핸들러
  const handleToggleFavorite = () => {
    if (isTogglingFavorite || !hasRealPropertyId) return;

    toggleFavorite(
      { propertyId: numericId, isFavorite },
      {
        onSuccess: () => {
          // 성공 시 아무것도 안해도 됨 (자동으로 캐시 업데이트)
        },
        onError: (error) => {
          console.error('찜 토글 실패:', error);
          Alert.alert('오류', '찜하기에 실패했습니다. 다시 시도해주세요.');
        },
      }
    );
  };

  // 인프라 아이콘
  const getInfraIcon = (category: string) => {
    switch (category) {
      case 'SUBWAY': return '🚇';
      case 'SCHOOL': return '🏫';
      case 'HOSPITAL': return '🏥';
      case 'MART': return '🛒';
      default: return '📍';
    }
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        {hasRealPropertyId && (
          <TouchableOpacity
            style={styles.favoriteBtn}
            onPress={handleToggleFavorite}
            activeOpacity={0.7}
            disabled={isTogglingFavorite}
          >
            <Text style={styles.favoriteIcon}>
              {isTogglingFavorite ? '⏳' : isFavorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 이미지 (현재는 placeholder) */}
        <View style={styles.imageContainer}>
          <PropertyImagePlaceholder size={72} />
          <View style={styles.imageOverlay}>
            <View style={styles.typeTag}>
              <Text style={styles.typeTagText}>{getTypeLabel(property.transactionType)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* 기본 정보 */}
          <View style={styles.section}>
            <Text style={styles.propertyName}>{property.name}</Text>
            <Text style={styles.propertyAddress}>{property.roadAddress}</Text>
            <Text style={styles.propertyPrice}>{formatPrice(property.price)}</Text>

            {/* DSR 정보 */}
            {dsr !== null && (
              <View style={[styles.dsrBadge, isDsrSafe ? styles.dsrSafe : styles.dsrWarning]}>
                <Text style={[styles.dsrText, isDsrSafe ? styles.dsrTextSafe : styles.dsrTextWarning]}>
                  DSR {dsr}% {isDsrSafe ? '✓ 적합' : '⚠ 주의'}
                </Text>
              </View>
            )}
          </View>

          {/* 상세 정보 칩 */}
          {(property.exclusiveArea || property.floor || property.parkingRatio) && (
            <View style={styles.section}>
              <View style={styles.chipRow}>
                {property.exclusiveArea && (
                  <View style={styles.chip}>
                    <Text style={styles.chipLabel}>전용면적</Text>
                    <Text style={styles.chipValue}>{property.exclusiveArea.toFixed(1)}㎡</Text>
                  </View>
                )}
                {property.floor && (
                  <View style={styles.chip}>
                    <Text style={styles.chipLabel}>층수</Text>
                    <Text style={styles.chipValue}>{property.floor}층</Text>
                  </View>
                )}
                {property.parkingRatio && (
                  <View style={styles.chip}>
                    <Text style={styles.chipLabel}>주차</Text>
                    <Text style={styles.chipValue}>
                      {property.parkingRatio < 10
                        ? (property.parkingRatio * 100).toFixed(0)
                        : property.parkingRatio.toFixed(0)}%
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* 건물 정보 */}
          {(property.builder || property.completionYear || property.households || property.totalFloors) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>건물 정보</Text>
              {property.builder && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>건설사</Text>
                  <Text style={styles.infoValue}>{property.builder}</Text>
                </View>
              )}
              {property.completionYear && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>준공년도</Text>
                  <Text style={styles.infoValue}>{property.completionYear}년</Text>
                </View>
              )}
              {property.households && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>총 세대수</Text>
                  <Text style={styles.infoValue}>{property.households}세대</Text>
                </View>
              )}
              {property.totalFloors && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>총 층수</Text>
                  <Text style={styles.infoValue}>지상 {property.totalFloors}층</Text>
                </View>
              )}
            </View>
          )}

          {/* 주변 인프라 */}
          {property.infrastructures && property.infrastructures.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>주변 인프라</Text>
              {property.infrastructures.map((infra, idx) => (
                <View key={idx} style={styles.infraRow}>
                  <Text style={styles.infraIcon}>{getInfraIcon(infra.category)}</Text>
                  <View style={styles.infraInfo}>
                    <Text style={styles.infraName}>{infra.placeName}</Text>
                    <Text style={styles.infraDistance}>도보 {infra.distance}m</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* 대출 정보 */}
          {financeData && property.price && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>예상 대출 정보</Text>
              <View style={styles.loanCard}>
                <View style={styles.loanRow}>
                  <Text style={styles.loanLabel}>대출 가능 금액 (LTV 70%)</Text>
                  <Text style={styles.loanValue}>
                    {formatPrice(Math.floor(property.price * 0.7))}
                  </Text>
                </View>
                <View style={styles.loanRow}>
                  <Text style={styles.loanLabel}>예상 금리</Text>
                  <Text style={styles.loanValue}>연 4.0%</Text>
                </View>
                <View style={styles.loanRow}>
                  <Text style={styles.loanLabel}>예상 월 상환액 (30년)</Text>
                  <Text style={styles.loanValue}>
                    {Math.floor((property.price * 10000 * 0.7 * 0.04) / 12 / 10000).toLocaleString()}만원
                  </Text>
                </View>
              </View>
              <Text style={styles.loanNotice}>
                * 실제 대출 조건은 금융기관 심사에 따라 달라질 수 있습니다
              </Text>
              <TouchableOpacity
                style={styles.simulationBtn}
                onPress={() =>
                  router.push({
                    pathname: `/loans/${id}`,
                    params: {
                      propertyData: JSON.stringify({
                        name: property.name,
                        price: property.price,
                        transactionType: property.transactionType,
                      }),
                    },
                  })
                }
                activeOpacity={0.85}
              >
                <Text style={styles.simulationBtnText}>대출 상품 비교 · 시뮬레이션 →</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* 하단 CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.inquiryBtn} activeOpacity={0.8}>
          <Text style={styles.inquiryBtnText}>문의하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.consultBtn} activeOpacity={0.8}>
          <Text style={styles.consultBtnText}>AI 상담</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  backIcon: { fontSize: 20, color: colors.navy },
  favoriteBtn: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  favoriteIcon: { fontSize: 20 },

  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
    position: 'relative',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  typeTag: {
    backgroundColor: colors.navy,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typeTagText: { fontSize: 12, fontWeight: '700', color: colors.white },

  body: { paddingHorizontal: spacing.lg },

  section: {
    marginTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  propertyName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  propertyAddress: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 12,
  },
  propertyPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: -0.8,
    marginBottom: 12,
  },

  dsrBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dsrSafe: { backgroundColor: colors.mintLight },
  dsrWarning: { backgroundColor: '#FFF0EB' },
  dsrText: { fontSize: 13, fontWeight: '700' },
  dsrTextSafe: { color: colors.mintText },
  dsrTextWarning: { color: colors.warn },

  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  chipLabel: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 4,
  },
  chipValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: -0.3,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: -0.3,
    marginBottom: 14,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.muted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },

  infraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  infraIcon: { fontSize: 24 },
  infraInfo: { flex: 1 },
  infraName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: 2,
  },
  infraDistance: {
    fontSize: 11,
    color: colors.muted,
  },

  loanCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 0.5,
    borderColor: colors.border,
    marginBottom: 8,
  },
  loanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  loanLabel: {
    fontSize: 13,
    color: colors.muted,
  },
  loanValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navy,
  },
  loanNotice: {
    fontSize: 11,
    color: colors.muted,
    lineHeight: 16,
    marginBottom: 12,
  },
  simulationBtn: {
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  simulationBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },

  bottomBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  inquiryBtn: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  inquiryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
  },
  consultBtn: {
    flex: 1,
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  consultBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },

  // Loading / Error states
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 12,
  },
  errorText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});
