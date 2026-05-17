import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, radius, spacing } from '@/constants/tokens';

const SAVED = [
  { id: '1', name: '래미안 퍼스티지', location: '서초구 반포동', price: '13억 5,000', type: '매매' },
  { id: '2', name: '합정역 한강아파트', location: '마포구 합정동', price: '4억 2,000', type: '매매' },
];

const SETTINGS = [
  { icon: '🔔', label: '알림 설정', sub: '시세 변동·추천 업데이트' },
  { icon: '✏️', label: '재무 정보 수정', sub: '소득·자산·부채·희망 지역' },
  { icon: '🔒', label: '개인정보 처리방침' },
  { icon: '📄', label: '이용약관' },
];

export default function MyScreen() {
  const insets = useSafeAreaInsets();

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
              <Text style={styles.profileName}>박수민</Text>
              <Text style={styles.profileEmail}>parksumin@email.com</Text>
            </View>
            <TouchableOpacity style={styles.editBtn}>
              <Text style={styles.editBtnText}>편집</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.body}>
          {/* Financial Summary */}
          <View style={styles.sectionLabel}>
            <Text style={styles.sectionLabelText}>재무 체력</Text>
          </View>
          <View style={styles.finCard}>
            <View style={styles.finTop}>
              <View>
                <Text style={styles.finScoreLabel}>현재 점수</Text>
                <View style={styles.finScoreRow}>
                  <Text style={styles.finScore}>72</Text>
                  <Text style={styles.finScoreMax}> / 100</Text>
                </View>
              </View>
              <View style={styles.finBadge}>
                <Text style={styles.finBadgeText}>양호</Text>
              </View>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: '72%' }]} />
            </View>
            <View style={styles.finStats}>
              {[
                { label: '연소득', value: '350만원' },
                { label: '보유자산', value: '1억 2,000' },
                { label: '현재부채', value: '3,500만' },
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

          {/* DSR / LTV chips */}
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaVal}>LTV 70%</Text>
              <Text style={styles.metaLbl}>대출 한도</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={[styles.metaVal, { color: colors.mint }]}>DSR 28%</Text>
              <Text style={styles.metaLbl}>상환 비율</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={[styles.metaVal, { color: colors.mintText }]}>5.1억</Text>
              <Text style={styles.metaLbl}>구매 예산</Text>
            </View>
          </View>

          {/* Saved properties */}
          <View style={styles.sectionLabel}>
            <Text style={styles.sectionLabelText}>관심 매물</Text>
            <TouchableOpacity>
              <Text style={styles.sectionMore}>전체보기 →</Text>
            </TouchableOpacity>
          </View>
          {SAVED.map((s) => (
            <View key={s.id} style={styles.savedCard}>
              <View style={styles.savedThumb} />
              <View style={styles.savedInfo}>
                <Text style={styles.savedName}>{s.name}</Text>
                <Text style={styles.savedLoc}>{s.location} · {s.type}</Text>
                <Text style={styles.savedPrice}>{s.price}</Text>
              </View>
              <TouchableOpacity style={styles.heartBtn}>
                <Text style={{ fontSize: 16 }}>♥</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Settings */}
          <View style={[styles.sectionLabel, { marginTop: 8 }]}>
            <Text style={styles.sectionLabelText}>설정</Text>
          </View>
          <View style={styles.settingsCard}>
            {SETTINGS.map((s, i) => (
              <React.Fragment key={s.label}>
                <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
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
            onPress={() => router.replace('/onboarding/login')}
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
});
