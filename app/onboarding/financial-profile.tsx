import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

export default function FinancialProfile() {
  return (
    <View style={styles.container}>
      <Text style={[typography.h2, styles.title]}>재무 정보 입력</Text>
      <Text style={[typography.body, styles.desc]}>
        소득·자산·부채와 희망 지역을 입력해주세요
      </Text>
      {/* TODO: 소득/자산/부채 입력 폼 + 지역 칩 */}
      <TouchableOpacity style={styles.button} onPress={() => router.push('/onboarding/login')}>
        <Text style={styles.buttonText}>다음</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 24,
    paddingTop: 64,
  },
  title: {
    color: colors.navy,
    marginBottom: 8,
  },
  desc: {
    color: colors.muted,
    marginBottom: 32,
  },
  button: {
    backgroundColor: colors.navy,
    borderRadius: 16,
    paddingVertical: 19,
    alignItems: 'center',
    marginTop: 'auto',
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
