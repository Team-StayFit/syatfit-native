import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

export default function Login() {
  const handleSkip = () => router.replace('/(tabs)');

  return (
    <View style={styles.container}>
      <Text style={[typography.h2, styles.title]}>로그인</Text>
      <Text style={[typography.body, styles.desc]}>
        소셜 계정으로 간편 로그인하세요
      </Text>
      {/* TODO: 카카오 / Apple / 네이버 로그인 버튼 */}
      <TouchableOpacity style={[styles.button, styles.kakao]}>
        <Text style={styles.kakaoText}>카카오로 시작하기</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.apple]}>
        <Text style={styles.appleText}>Apple로 시작하기</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>비로그인으로 계속하기</Text>
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
    marginBottom: 48,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 19,
    alignItems: 'center',
    marginBottom: 12,
  },
  kakao: {
    backgroundColor: '#FEE500',
  },
  kakaoText: {
    color: '#191919',
    fontSize: 16,
    fontWeight: '700',
  },
  apple: {
    backgroundColor: '#000000',
  },
  appleText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  skipText: {
    color: colors.muted,
    fontSize: 14,
  },
});
