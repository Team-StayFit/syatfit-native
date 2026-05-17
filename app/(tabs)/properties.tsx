import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@/constants/tokens';

type ViewMode = 'list' | 'map';
type FilterType = '전체' | '매매' | '전세' | '오피스텔';

const PROPERTIES = [
  {
    id: '1', name: '래미안 퍼스티지', location: '서초구 반포동',
    price: '13억 5,000', priceLabel: '매매가', type: '매매',
    dsr: 37.5, ltv: 47, suitable: true, area: '84㎡', floor: '12층',
  },
  {
    id: '2', name: '파크스테이트 광교', location: '수원시 영통구',
    price: '4억 8,000', priceLabel: '전세가', type: '전세',
    dsr: 35.2, ltv: 40, suitable: true, area: '59㎡', floor: '7층',
  },
  {
    id: '3', name: '합정역 한강아파트', location: '마포구 합정동',
    price: '4억 2,000', priceLabel: '매매가', type: '매매',
    dsr: 38.1, ltv: 55, suitable: true, area: '49㎡', floor: '3층',
  },
  {
    id: '4', name: '아크로 서울포레스트', location: '성동구 성수동',
    price: '18억 2,000', priceLabel: '매매가', type: '매매',
    dsr: 41.2, ltv: 60, suitable: false, area: '115㎡', floor: '25층',
  },
  {
    id: '5', name: '브라이튼 여의도', location: '영등포구 여의도동',
    price: '3억 2,000', priceLabel: '전세가', type: '전세',
    dsr: 29.8, ltv: 35, suitable: true, area: '33㎡', floor: '18층',
  },
  {
    id: '6', name: '상암 DMC 오피스텔', location: '마포구 상암동',
    price: '2억 8,000', priceLabel: '매매가', type: '오피스텔',
    dsr: 35.2, ltv: 45, suitable: true, area: '27㎡', floor: '9층',
  },
];

const FILTERS: FilterType[] = ['전체', '매매', '전세', '오피스텔'];

export default function PropertyListScreen() {
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeFilter, setActiveFilter] = useState<FilterType>('전체');

  const filtered = activeFilter === '전체'
    ? PROPERTIES
    : PROPERTIES.filter((p) => p.type === activeFilter);

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
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipOn]}
            onPress={() => setActiveFilter(f)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextOn]}>
              {f}
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
          총 <Text style={styles.countNum}>{filtered.length}</Text>개
        </Text>
        <Text style={styles.countSub}>재무 체력 기반 필터 적용</Text>
      </View>

      {viewMode === 'list' ? (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <PropertyRow item={item} />}
        />
      ) : (
        <MapPlaceholder />
      )}
    </View>
  );
}

function PropertyRow({ item }: { item: typeof PROPERTIES[0] }) {
  return (
    <TouchableOpacity style={styles.propRow} activeOpacity={0.85}>
      <View style={styles.propThumb}>
        <View style={styles.propTypeTag}>
          <Text style={styles.propTypeText}>{item.type}</Text>
        </View>
      </View>
      <View style={styles.propInfo}>
        <View style={styles.propTopRow}>
          <Text style={styles.propName}>{item.name}</Text>
          {item.suitable ? (
            <View style={styles.suitBadge}>
              <Text style={styles.suitText}>✓ 적합</Text>
            </View>
          ) : (
            <View style={[styles.suitBadge, { backgroundColor: '#FFF0EB' }]}>
              <Text style={[styles.suitText, { color: colors.warn }]}>DSR 주의</Text>
            </View>
          )}
        </View>
        <Text style={styles.propLoc}>{item.location} · {item.area} · {item.floor}</Text>
        <Text style={styles.propPrice}>{item.price}</Text>
        <View style={styles.propMeta}>
          <Text style={styles.propMetaText}>LTV {item.ltv}%</Text>
          <View style={styles.metaDot} />
          <Text style={[
            styles.propMetaText,
            { color: item.dsr >= 40 ? colors.warn : colors.mint },
          ]}>
            DSR {item.dsr}%
          </Text>
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
});
