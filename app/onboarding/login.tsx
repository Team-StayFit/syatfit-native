import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors, radius, spacing } from '@/constants/tokens';
import { useLogin } from '@/hooks/useAuth';

export default function Login() {
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { mutate: loginMutation, isPending } = useLogin();

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    loginMutation(
      { email, password },
      {
        onSuccess: async () => {
          // 토큰 저장이 완료될 때까지 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 100));
          // 성공 시 메인 화면으로
          router.replace('/(tabs)');
        },
        onError: (error: any) => {
          console.error('로그인 실패:', error);
          const message = error.response?.data?.message || '로그인에 실패했습니다.';
          Alert.alert('오류', message);
        },
      }
    );
  };

  const handleKakao = () => {
    // TODO: Kakao OAuth2
    Alert.alert('알림', 'Kakao 로그인은 준비 중입니다.');
  };

  const handleGoogle = () => {
    // TODO: Google OAuth2
    Alert.alert('알림', 'Google 로그인은 준비 중입니다.');
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.body}>
          {/* Top: logo + headline */}
          <View style={styles.top}>
            <View style={styles.logoRow}>
              <View style={styles.logoIco}>
                <Text style={{ fontSize: 20 }}>🏠</Text>
              </View>
              <Text style={styles.logoText}>
                stay<Text style={styles.logoAccent}>fit</Text>
              </Text>
            </View>

            <Text style={styles.title}>1분 만에{'\n'}시작해요</Text>
            <Text style={styles.subtitle}>
              로그인하고 내 재무 체력에 맞는{'\n'}매물을 바로 확인해보세요
            </Text>
          </View>

          {/* Auth buttons */}
          <View style={styles.btnGroup}>
            {showEmailLogin ? (
              // 이메일 로그인 폼
              <>
                <View style={styles.formGroup}>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="이메일"
                    placeholderTextColor={colors.mutedLight}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.formGroup}>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="비밀번호"
                    placeholderTextColor={colors.mutedLight}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.btnPrimary, isPending && styles.btnDisabled]}
                  onPress={handleEmailLogin}
                  disabled={isPending}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnPrimaryText}>
                    {isPending ? '로그인 중...' : '로그인'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnBack}
                  onPress={() => setShowEmailLogin(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.btnBackText}>← 다른 방법으로 로그인</Text>
                </TouchableOpacity>
              </>
            ) : (
              // 소셜/일반 로그인 선택
              <>
                <TouchableOpacity
                  style={styles.btnEmail}
                  onPress={() => setShowEmailLogin(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.emailIcon}>✉️</Text>
                  <Text style={styles.btnEmailText}>이메일로 로그인</Text>
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>또는</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.btnKakao}
                  onPress={handleKakao}
                  activeOpacity={0.85}
                >
                  <Text style={styles.kakaoIcon}>💬</Text>
                  <Text style={styles.btnKakaoText}>카카오로 계속하기</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnGoogle}
                  onPress={handleGoogle}
                  activeOpacity={0.85}
                >
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.btnGoogleText}>Google로 계속하기</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnSignup}
                  onPress={() => router.push('/onboarding/signup')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.btnSignupText}>
                    계정이 없으신가요? <Text style={styles.btnSignupBold}>회원가입</Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnGuest}
                  onPress={() => router.replace('/(tabs)')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.btnGuestText}>비로그인으로 둘러보기</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={styles.terms}>
            로그인 시 이용약관 및 개인정보 처리방침에{'\n'}동의하는 것으로 간주됩니다
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },

  top: { paddingTop: 60 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32 },
  logoIco: {
    width: 38, height: 38,
    backgroundColor: colors.mint,
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 21, fontWeight: '800', color: colors.navy, letterSpacing: -0.5 },
  logoAccent: { color: colors.mint },

  title: {
    fontSize: 30, fontWeight: '800', color: colors.navy,
    letterSpacing: -1, lineHeight: 38, marginBottom: 8,
  },
  subtitle: { fontSize: 14, color: colors.muted, lineHeight: 22 },

  btnGroup: { gap: 12 },

  // 이메일 로그인 폼
  formGroup: { marginBottom: 0 },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    fontSize: 15,
    color: colors.navy,
  },

  btnPrimary: {
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    padding: 18,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: colors.white },

  btnBack: {
    padding: 10,
    alignItems: 'center',
  },
  btnBackText: { fontSize: 14, color: colors.muted },

  // 이메일 로그인 버튼
  btnEmail: {
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  emailIcon: { fontSize: 18 },
  btnEmailText: { fontSize: 15, fontWeight: '700', color: colors.white },

  // 구분선
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: '#E2DED6' },
  dividerText: { fontSize: 12, color: colors.mutedLight },

  // 카카오
  btnKakao: {
    backgroundColor: colors.kakao,
    borderRadius: radius.md,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  kakaoIcon: { fontSize: 18 },
  btnKakaoText: { fontSize: 15, fontWeight: '700', color: '#1A1200' },

  // Google
  btnGoogle: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E2DED6',
    borderRadius: radius.md,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4285F4',
  },
  btnGoogleText: { fontSize: 15, fontWeight: '700', color: colors.navy },

  // 회원가입 링크
  btnSignup: {
    padding: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  btnSignupText: { fontSize: 14, color: colors.muted },
  btnSignupBold: { color: colors.navy, fontWeight: '700' },

  // 비로그인
  btnGuest: {
    borderWidth: 0.5,
    borderColor: '#E2DED6',
    borderRadius: radius.md,
    padding: 13,
    alignItems: 'center',
  },
  btnGuestText: { fontSize: 13, color: colors.muted },

  terms: { fontSize: 11, color: '#C4C8D0', textAlign: 'center', lineHeight: 18 },
});
