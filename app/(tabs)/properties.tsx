import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, radius, spacing } from '@/constants/tokens';
import { usePropertySearch } from '@/hooks/useProperty';
import { useCheckFavorite, useToggleFavorite } from '@/hooks/useFavorite';

type ViewMode = 'list' | 'map';
type FilterType = '전체' | 'TRADING' | 'LEASE';

const FILTERS: { label: string; value: FilterType }[] = [
  { label: '전체', value: '전체' },
  { label: '매매', value: 'TRADING' },
  { label: '전세', value: 'LEASE' },
];

export default function PropertyListScreen() {
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeFilter, setActiveFilter] = useState<FilterType>('전체');

  // API 호출: 마포구 매물 검색
  const { data, isLoading, error } = usePropertySearch({
    sgg_name: '마포구',
    transaction_type: activeFilter === '전체' ? undefined : activeFilter,
  });

  // 거래 정보가 있는 매물만 필터링 (price나 type이 null인 매물 제외)
  const properties = (data?.properties || []).filter(p =>
    p.transactionType && (p.price !== null || p.monthlyRent !== null)
  );
  const totalCount = data?.totalCount || 0;

  console.log('🏠 전체 매물:', data?.properties?.length || 0);
  console.log('🏠 표시 가능한 매물:', properties.length);

  // 월세 매물 확인
  const rentProperties = properties.filter(p => p.transactionType === 'RENT');
  console.log('🏠 월세 매물 개수:', rentProperties.length);
  if (rentProperties.length > 0) {
    console.log('🏠 월세 매물 샘플 (처음 3개):', rentProperties.slice(0, 3).map(p => ({
      name: p.name,
      보증금: p.price,
      월세: p.monthlyRent,
    })));
  }

  // 전세 매물 확인
  const leaseProperties = properties.filter(p => p.transactionType === 'LEASE');
  console.log('🏠 전세 매물 개수:', leaseProperties.length);
  if (leaseProperties.length > 0) {
    console.log('🏠 전세 매물 샘플 (처음 5개):', leaseProperties.slice(0, 5).map(p => ({
      name: p.name,
      전세금: p.price,
    })));
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>매물 탐색</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
              리스트
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'map' && styles.toggleActive]}
            onPress={() => setViewMode('map')}
          >
            <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>
              지도
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterChip, activeFilter === f.value && styles.filterChipOn]}
            onPress={() => setActiveFilter(f.value)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterText, activeFilter === f.value && styles.filterTextOn]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.sortBtn}>
          <Text style={styles.sortText}>정렬 ↕</Text>
        </TouchableOpacity>
      </View>

      {/* Result count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          총 <Text style={styles.countNum}>{totalCount}</Text>개
        </Text>
        <Text style={styles.countSub}>마포구 매물</Text>
      </View>

      {/* Loading / Error / Content */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.navy} />
          <Text style={styles.loadingText}>매물을 불러오는 중...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>❌ 매물을 불러올 수 없습니다</Text>
          <Text style={styles.errorSubText}>{(error as Error).message}</Text>
        </View>
      ) : viewMode === 'list' ? (
        <FlatList
          data={properties}
          keyExtractor={(item, index) => item.propertyId ? String(item.propertyId) : `property-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <PropertyRow item={item} />}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>🏠 매물이 없습니다</Text>
            </View>
          }
        />
      ) : (
        <MapPlaceholder />
      )}
    </View>
  );
}

function PropertyRow({ item }: { item: any }) {
  // 찜 상태 조회 및 토글
  const { data: isFavorite = false } = useCheckFavorite(item.propertyId);
  const { mutate: toggleFavorite, isPending: isTogglingFavorite } = useToggleFavorite();

  // 가격 포맷팅: 만원 단위 → 억/만원 표시
  const formatPrice = (priceManWon: number) => {
    if (!priceManWon || priceManWon === 0) return '0';
    const eok = Math.floor(priceManWon / 10000); // 만원 → 억
    const man = priceManWon % 10000; // 나머지 만원
    if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만`;
    if (eok > 0) return `${eok}억`;
    return `${man.toLocaleString()}만`;
  };

  // 거래 유형에 따른 가격 표시
  const getPriceDisplay = () => {
    if (item.transactionType === 'RENT') {
      // 월세: 보증금 있으면 "보증금 / 월세", 없으면 "월세"만
      const monthly = formatPrice(item.monthlyRent);
      if (item.price && item.price > 0) {
        const deposit = formatPrice(item.price);
        return `${deposit} / 월 ${monthly}`;
      }
      return `월세 ${monthly}`;
    } else if (item.transactionType === 'LEASE') {
      // 전세: 전세금만
      return `전세 ${formatPrice(item.price)}`;
    } else {
      // 매매: 매매가만
      return `매매 ${formatPrice(item.price)}`;
    }
  };

  // 거래 유형 한글 변환
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
      { propertyId: Number(item.propertyId), isFavorite },
      {
        onError: (error) => {
          console.error('찜 토글 실패:', error);
        },
      }
    );
  };

  return (
    <TouchableOpacity
      style={styles.propRow}
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: `/property/${item.propertyId}`,
          params: { propertyData: JSON.stringify(item) },
        })
      }
    >
      <View style={styles.propThumb}>
        <View style={styles.propTypeTag}>
          <Text style={styles.propTypeText}>{getTypeLabel(item.transactionType)}</Text>
        </View>
      </View>
      <View style={styles.propInfo}>
        <View style={styles.propTopRow}>
          <Text style={styles.propName}>{item.name}</Text>
          <TouchableOpacity
            onPress={handleToggleFavorite}
            disabled={isTogglingFavorite}
            style={styles.favoriteBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.favoriteIcon}>
              {isTogglingFavorite ? '⏳' : isFavorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.propLoc}>
          {item.roadAddress} · {item.exclusiveArea?.toFixed(0)}㎡
        </Text>
        <Text style={styles.propPrice}>{getPriceDisplay()}</Text>
        <View style={styles.propMeta}>
          {item.parkingRatio && (
            <Text style={styles.propMetaText}>
              주차 {item.parkingRatio < 10 ? (item.parkingRatio * 100).toFixed(0) : item.parkingRatio.toFixed(0)}%
            </Text>
          )}
          {item.builder && item.parkingRatio && <View style={styles.metaDot} />}
          {item.builder && (
            <Text style={styles.propMetaText}>{item.builder}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function MapPlaceholder() {
  return (
    <View style={styles.mapWrap}>
      <View style={styles.mapBox}>
        <Text style={{ fontSize: 32, marginBottom: 12 }}>🗺️</Text>
        <Text style={styles.mapTitle}>카카오맵 연동 예정</Text>
        <Text style={styles.mapDesc}>WebView로 구현됩니다</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.lg, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.white, letterSpacing: -0.4 },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10, padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 8,
  },
  toggleActive: { backgroundColor: colors.white },
  toggleText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  toggleTextActive: { color: colors.navy },

  filterRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: 12,
    backgroundColor: colors.white, gap: 7,
    borderBottomWidth: 0.5, borderBottomColor: colors.border,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: radius.full, borderWidth: 0.5, borderColor: '#E2DED6',
    backgroundColor: colors.bg,
  },
  filterChipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  filterText: { fontSize: 12, fontWeight: '600', color: colors.muted },
  filterTextOn: { color: colors.white },
  sortBtn: {
    paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: radius.full, borderWidth: 0.5, borderColor: '#E2DED6',
  },
  sortText: { fontSize: 12, fontWeight: '600', color: colors.muted },

  countRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: 10,
  },
  countText: { fontSize: 12, color: colors.muted },
  countNum: { fontWeight: '800', color: colors.navy },
  countSub: { fontSize: 11, color: colors.mint, fontWeight: '600' },

  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 32, gap: 10 },

  propRow: {
    backgroundColor: colors.white,
    borderRadius: radius.lg, overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 0.5, borderColor: colors.border,
  },
  propThumb: {
    width: 100, height: 100, backgroundColor: '#DDE3EF',
    position: 'relative', justifyContent: 'flex-end', padding: 7,
  },
  propTypeTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.navy, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  propTypeText: { fontSize: 9, fontWeight: '700', color: colors.white },
  propInfo: { flex: 1, padding: 12 },
  propTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 },
  propName: { fontSize: 13, fontWeight: '700', color: colors.navy, letterSpacing: -0.2, flex: 1 },
  favoriteBtn: { marginLeft: 8 },
  favoriteIcon: { fontSize: 16 },
  suitBadge: {
    backgroundColor: colors.mintLight, borderRadius: 5,
    paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6,
  },
  suitText: { fontSize: 9, fontWeight: '700', color: colors.mintText },
  propLoc: { fontSize: 11, color: colors.muted, marginBottom: 6 },
  propPrice: { fontSize: 14, fontWeight: '800', color: colors.navy, letterSpacing: -0.4, marginBottom: 6 },
  propMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  propMetaText: { fontSize: 10, fontWeight: '700', color: colors.muted },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.border },

  mapWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mapBox: { alignItems: 'center' },
  mapTitle: { fontSize: 15, fontWeight: '700', color: colors.navy, marginBottom: 4 },
  mapDesc: { fontSize: 13, color: colors.muted },

  // Loading / Error / Empty states
  centerContainer: {
    flex: 1,
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
    marginBottom: 6,
  },
  errorSubText: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.muted,
  },
});
