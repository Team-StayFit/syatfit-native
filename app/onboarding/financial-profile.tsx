import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useAtom } from 'jotai';
import { financialProfileAtom } from '@/atoms/financialProfile';
import { colors, radius, spacing } from '@/constants/tokens';

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '기타'];

const MOCK_VALUES = { income: 350, assets: 12000, debt: 3500 };

export default function FinancialProfile() {
  const [, setProfile] = useAtom(financialProfileAtom);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['서울', '경기']);

  const toggleRegion = (r: string) => {
    setSelectedRegions((prev) =>
      prev.includes(r)
        ? prev.filter((x) => x !== r)
        : prev.length < 3 ? [...prev, r] : prev
    );
  };

  const handleNext = () => {
    setProfile({ ...MOCK_VALUES, regions: selectedRegions });
    router.push('/onboarding/login');
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress bar */}
        <View style={styles.progressRow}>
          <View style={[styles.progressBar, styles.done]} />
          <View style={[styles.progressBar, styles.active]} />
          <View style={styles.progressBar} />
        </View>

        <Text style={styles.title}>재무 정보를{'\n'}알려주세요</Text>
        <Text style={styles.subtitle}>
          입력한 정보는 매물 추천에만 활용되며{'\n'}언제든지 수정할 수 있어요
        </Text>

        <InputCard label="연소득" value="350" unit="만원 / 년" />
        <InputCard label="보유 자산" value="1억 2,000" unit="만원" />
        <InputCard label="현재 부채" value="3,500" unit="만원" />

        {/* 희망 지역 */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>희망 지역 (최대 3개)</Text>
          <View style={styles.chipRow}>
            {REGIONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.chip, selectedRegions.includes(r) && styles.chipOn]}
                onPress={() => toggleRegion(r)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, selectedRegions.includes(r) && styles.chipTextOn]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.btnPrimaryText}>다음 단계</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InputCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity style={styles.inputCard} activeOpacity={0.8}>
        <Text style={styles.inputValue}>{value}</Text>
        <Text style={styles.inputUnit}>{unit}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: 70, paddingBottom: 48 },

  progressRow: { flexDirection: 'row', gap: 5, marginBottom: 30 },
  progressBar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: '#E2DED6' },
  done: { backgroundColor: colors.navy },
  active: { backgroundColor: colors.mint },

  title: {
    fontSize: 25, fontWeight: '800', color: colors.navy,
    letterSpacing: -0.8, lineHeight: 32, marginBottom: 6,
  },
  subtitle: { fontSize: 13, color: colors.muted, lineHeight: 20, marginBottom: 26 },

  fieldBlock: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: '#B0B8C4',
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 7,
  },

  inputCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 15,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  inputValue: { fontSize: 18, fontWeight: '800', color: colors.navy, letterSpacing: -0.5 },
  inputUnit: { fontSize: 13, color: colors.mutedLight },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: {
    paddingHorizontal: 15, paddingVertical: 9,
    borderRadius: radius.full,
    borderWidth: 0.5, borderColor: '#E2DED6',
    backgroundColor: colors.white,
  },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.muted },
  chipTextOn: { color: colors.white },

  btnPrimary: {
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    padding: 19,
    alignItems: 'center',
    marginTop: 24,
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: colors.white, letterSpacing: -0.3 },
});
