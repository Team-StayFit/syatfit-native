import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { colors, radius, spacing } from '@/constants/tokens';

export default function Login() {
  const handleKakao = () => {
    // TODO: @react-native-seoul/kakao-login
    router.replace('/(tabs)');
  };

  const handleApple = () => {
    // TODO: @invertase/react-native-apple-authentication
    router.replace('/(tabs)');
  };

  const handleNaver = () => {
    // TODO: WebView OAuth redirect
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.root}>
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
          <TouchableOpacity style={styles.btnKakao} onPress={handleKakao} activeOpacity={0.85}>
            <Text style={styles.kakaoIcon}>💬</Text>
            <Text style={styles.btnKakaoText}>카카오로 계속하기</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnApple} onPress={handleApple} activeOpacity={0.85}>
            <Text style={[styles.appleIcon, { color: colors.white }]}></Text>
            <Text style={styles.btnAppleText}>Apple로 계속하기</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnNaver} onPress={handleNaver} activeOpacity={0.85}>
            <Text style={styles.naverN}>N</Text>
            <Text style={styles.btnNaverText}>네이버로 계속하기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnGuest}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.7}
          >
            <Text style={styles.btnGuestText}>비로그인으로 둘러보기</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.terms}>
          로그인 시 이용약관 및 개인정보 처리방침에{'\n'}동의하는 것으로 간주됩니다
        </Text>
      </View>
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

  btnGroup: { gap: 10 },

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

  btnApple: {
    backgroundColor: colors.dark,
    borderRadius: radius.md,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  appleIcon: { fontSize: 18 },
  btnAppleText: { fontSize: 15, fontWeight: '700', color: colors.white },

  btnNaver: {
    backgroundColor: colors.naver,
    borderRadius: radius.md,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  naverN: { fontSize: 16, fontWeight: '900', color: colors.white },
  btnNaverText: { fontSize: 15, fontWeight: '700', color: colors.white },

  btnGuest: {
    borderWidth: 0.5,
    borderColor: '#E2DED6',
    borderRadius: radius.md,
    padding: 13,
    alignItems: 'center',
    marginTop: 2,
  },
  btnGuestText: { fontSize: 13, color: colors.muted },

  terms: { fontSize: 11, color: '#C4C8D0', textAlign: 'center', lineHeight: 18 },
});
