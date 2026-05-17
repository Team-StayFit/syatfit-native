import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

export default function OnboardingIntro() {
  return (
    <View style={styles.container}>
      <Text style={[typography.h1, styles.title]}>STAYfit</Text>
      <Text style={[typography.body, styles.subtitle]}>
        내 재무 상태에 맞는{'\n'}실제 구매 가능한 부동산을 찾아드립니다
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/onboarding/financial-profile')}>
        <Text style={styles.buttonText}>시작하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    color: colors.mint,
    marginBottom: 16,
  },
  subtitle: {
    color: colors.white,
    textAlign: 'center',
    marginBottom: 48,
    opacity: 0.8,
  },
  button: {
    backgroundColor: colors.mint,
    borderRadius: 16,
    paddingVertical: 19,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '700',
  },
});
