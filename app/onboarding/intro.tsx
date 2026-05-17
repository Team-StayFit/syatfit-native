import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { colors, radius, spacing } from '@/constants/tokens';

const FEATURES = [
  {
    icon: '📊',
    bg: '#E4FAF3',
    title: '재무 체력 점수',
    desc: 'LTV·DSR 기반으로 내 구매력을\n점수로 한눈에 확인',
  },
  {
    icon: '✦',
    bg: '#FFF0EB',
    title: 'AI 맞춤 매물 추천',
    desc: '일상 언어로 조건을 말하면\nAI가 최적 매물을 한 번에',
  },
  {
    icon: '📈',
    bg: '#EBF1FF',
    title: '매매 vs 전세 비교',
    desc: '월지출·LTV·DSR 실시간\n시뮬레이션 리포트',
  },
];

export default function OnboardingIntro() {
  return (
    <View style={styles.root}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <SafeAreaView>
            <View style={styles.logoRow}>
              <View style={styles.logoIco}>
                <Text style={styles.logoIcoText}>🏠</Text>
              </View>
              <Text style={styles.logoText}>
                stay<Text style={styles.logoAccent}>fit</Text>
              </Text>
            </View>

            <View style={styles.eyebrow}>
              <View style={styles.eyeDot} />
              <Text style={styles.eyeText}>AI 맞춤 부동산</Text>
            </View>

            <Text style={styles.h1}>
              내 재무 체력으로{'\n'}
              <Text style={styles.h1Accent}>딱 맞는 집</Text>을 찾다
            </Text>
            <Text style={styles.heroSub}>
              소득·자산·부채를 분석해{'\n'}실제로 살 수 있는 매물만 보여드려요
            </Text>
          </SafeAreaView>
        </View>

        {/* Feature cards + CTAs */}
        <View style={styles.lower}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureCard}>
              <View style={[styles.featureIco, { backgroundColor: f.bg }]}>
                <Text style={styles.featureEmoji}>{f.icon}</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => router.push('/onboarding/financial-profile')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>시작하기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnGhost}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.7}
          >
            <Text style={styles.btnGhostText}>나중에 둘러보기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy },

  hero: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: 32,
  },

  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 44 },
  logoIco: {
    width: 38, height: 38,
    backgroundColor: colors.mint,
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  logoIcoText: { fontSize: 20 },
  logoText: { fontSize: 21, fontWeight: '800', color: colors.white, letterSpacing: -0.5 },
  logoAccent: { color: colors.mint },

  eyebrow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 0.5, borderColor: 'rgba(0,199,140,0.35)',
    borderRadius: radius.full,
    paddingHorizontal: 11, paddingVertical: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,199,140,0.08)',
    marginBottom: 18,
  },
  eyeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mint },
  eyeText: { fontSize: 11, color: colors.mint, fontWeight: '700', letterSpacing: 0.3 },

  h1: {
    fontSize: 34, fontWeight: '800', color: colors.white,
    letterSpacing: -1.2, lineHeight: 42, marginBottom: 14,
  },
  h1Accent: { color: colors.mint },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 22 },

  lower: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: spacing.xl,
    paddingBottom: 48,
    gap: 10,
  },

  featureCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIco: {
    width: 46, height: 46,
    borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  featureEmoji: { fontSize: 22 },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: 14, fontWeight: '700', color: colors.navy,
    marginBottom: 3, letterSpacing: -0.2,
  },
  featureDesc: { fontSize: 12, color: colors.muted, lineHeight: 18 },

  btnPrimary: {
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    padding: 19,
    alignItems: 'center',
    marginTop: 14,
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: colors.white, letterSpacing: -0.3 },

  btnGhost: { padding: 13, alignItems: 'center' },
  btnGhostText: { fontSize: 13, color: colors.muted },
});
