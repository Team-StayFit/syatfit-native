import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, TextInput, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAtom } from 'jotai';
import { financialProfileAtom } from '@/atoms/financialProfile';
import { colors, radius, spacing } from '@/constants/tokens';
import { useUpdateUserFinance } from '@/hooks/useUserFinance';

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '기타'];

export default function FinancialProfile() {
  const [, setProfile] = useAtom(financialProfileAtom);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['서울', '경기']);

  // 입력 필드 상태
  const [annualIncome, setAnnualIncome] = useState('35000000'); // 3500만원
  const [capital, setCapital] = useState('120000000'); // 1억 2천만원
  const [totalDebt, setTotalDebt] = useState('35000000'); // 3500만원
  const [isHomeOwner, setIsHomeOwner] = useState(false);

  // API mutation
  const { mutate: saveFinance, isPending } = useUpdateUserFinance();

  const toggleRegion = (r: string) => {
    setSelectedRegions((prev) =>
      prev.includes(r)
        ? prev.filter((x) => x !== r)
        : prev.length < 3 ? [...prev, r] : prev
    );
  };

  const handleNext = () => {
    // 유효성 검증
    if (!annualIncome || !capital) {
      Alert.alert('알림', '연소득과 보유 자산은 필수 입력 항목입니다.');
      return;
    }

    // API 저장 (인증이 필요할 수 있음 - 실패해도 계속 진행)
    saveFinance(
      {
        annual_income: Number(annualIncome),
        capital: Number(capital),
        total_debt_amount: Number(totalDebt) || 0,
        monthly_repayment: 0, // 월 상환액은 나중에 추가
        is_home_owner: isHomeOwner,
      },
      {
        onSuccess: () => {
          console.log('재무 정보 저장 성공');
        },
        onError: (error) => {
          console.log('재무 정보 저장 실패:', error);

          // 서버 연결 에러인 경우
          if ((error as any).isServerError) {
            const retrySeconds = (error as any).retryAfter || 120;
            Alert.alert(
              '서버 연결 오류',
              `백엔드 서버가 일시적으로 연결 불가 상태입니다.\n약 ${retrySeconds}초 후에 다시 시도해주세요.`,
              [{ text: '확인' }]
            );
          }
          // 에러가 나도 계속 진행 (로그인 후 다시 입력할 수 있음)
        },
      }
    );

    // 로컬 상태 저장
    setProfile({
      income: Number(annualIncome) / 10000,
      assets: Number(capital) / 10000,
      debt: Number(totalDebt) / 10000,
      regions: selectedRegions,
    });

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

        <InputCard
          label="연소득"
          value={annualIncome}
          onChangeText={setAnnualIncome}
          placeholder="35000000"
          unit="원 / 년"
        />
        <InputCard
          label="보유 자산"
          value={capital}
          onChangeText={setCapital}
          placeholder="120000000"
          unit="원"
        />
        <InputCard
          label="현재 부채"
          value={totalDebt}
          onChangeText={setTotalDebt}
          placeholder="0"
          unit="원"
        />

        {/* 주택 소유 여부 */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>주택 소유 여부</Text>
          <View style={styles.chipRow}>
            <TouchableOpacity
              style={[styles.chip, !isHomeOwner && styles.chipOn]}
              onPress={() => setIsHomeOwner(false)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, !isHomeOwner && styles.chipTextOn]}>
                무주택
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, isHomeOwner && styles.chipOn]}
              onPress={() => setIsHomeOwner(true)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, isHomeOwner && styles.chipTextOn]}>
                유주택
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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

        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={handleNext}
          activeOpacity={0.85}
          disabled={isPending}
        >
          <Text style={styles.btnPrimaryText}>
            {isPending ? '저장 중...' : '다음 단계'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InputCard({
  label,
  value,
  onChangeText,
  placeholder,
  unit,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  unit: string;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputCard}>
        <TextInput
          style={styles.inputValue}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedLight}
          keyboardType="numeric"
        />
        <Text style={styles.inputUnit}>{unit}</Text>
      </View>
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
