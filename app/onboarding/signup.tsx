import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors, radius, spacing } from '@/constants/tokens';
import { useSignup } from '@/hooks/useAuth';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');

  const { mutate: signupMutation, isPending } = useSignup();

  const handleSignup = async () => {
    // 유효성 검증
    if (!email || !password || !username || !nickname) {
      Alert.alert('알림', '모든 필드를 입력해주세요.');
      return;
    }

    if (username.length < 4) {
      Alert.alert('알림', '사용자 이름은 최소 4자 이상이어야 합니다.');
      return;
    }

    if (nickname.length < 4) {
      Alert.alert('알림', '닉네임은 최소 4자 이상이어야 합니다.');
      return;
    }

    if (password.length < 4) {
      Alert.alert('알림', '비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }

    // API 호출
    signupMutation(
      { email, username, nickname, password },
      {
        onSuccess: () => {
          Alert.alert('성공', '회원가입이 완료되었습니다!', [
            { text: '확인', onPress: () => router.back() }
          ]);
        },
        onError: (error: any) => {
          console.error('회원가입 실패:', error);
          const message = error.response?.data?.message || '회원가입에 실패했습니다.';
          Alert.alert('오류', message);
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>← 뒤로</Text>
          </TouchableOpacity>

          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.subtitle}>
            이메일 계정으로{'\n'}간편하게 시작하세요
          </Text>

          {/* Input fields */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              placeholderTextColor={colors.mutedLight}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>사용자 이름 (최소 4자)</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="username"
              placeholderTextColor={colors.mutedLight}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>닉네임 (최소 4자)</Text>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="홍길동"
              placeholderTextColor={colors.mutedLight}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>비밀번호 (최소 4자)</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.mutedLight}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, isPending && styles.btnDisabled]}
            onPress={handleSignup}
            disabled={isPending}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>
              {isPending ? '가입 중...' : '회원가입'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.loginLinkText}>
              이미 계정이 있으신가요? <Text style={styles.loginLinkBold}>로그인</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing.xl,
    paddingTop: 60,
  },

  backBtn: {
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
    color: colors.navy,
    fontWeight: '600',
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 22,
    marginBottom: 32,
  },

  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: 8,
  },
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
    marginTop: 12,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },

  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: colors.muted,
  },
  loginLinkBold: {
    color: colors.navy,
    fontWeight: '700',
  },
});
