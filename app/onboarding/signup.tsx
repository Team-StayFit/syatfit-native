import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors, radius, spacing } from '@/constants/tokens';
import { useSignup, useCheckUsernameExists } from '@/hooks/useAuth';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');

  // 아이디 중복확인 결과: null(미확인) / true(사용가능) / false(중복)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkedUsername, setCheckedUsername] = useState('');

  const { mutate: signupMutation, isPending } = useSignup();
  const { mutate: checkUsername, isPending: isChecking } = useCheckUsernameExists();

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    // 아이디를 수정하면 기존 중복확인 결과는 무효화
    if (text !== checkedUsername) {
      setUsernameAvailable(null);
    }
  };

  const handleCheckUsername = () => {
    if (username.length < 4) {
      Alert.alert('알림', '사용자 이름은 최소 4자 이상이어야 합니다.');
      return;
    }

    checkUsername(username, {
      onSuccess: (exists) => {
        setCheckedUsername(username);
        setUsernameAvailable(!exists);
        if (exists) {
          Alert.alert('알림', '이미 사용 중인 아이디입니다.');
        }
      },
      onError: (error: any) => {
        console.error('아이디 중복 확인 실패:', error);
        Alert.alert('오류', '중복 확인 중 오류가 발생했습니다. 다시 시도해주세요.');
      },
    });
  };

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

    if (checkedUsername !== username || usernameAvailable !== true) {
      Alert.alert('알림', '아이디 중복확인을 먼저 진행해주세요.');
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
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.rowInput]}
                value={username}
                onChangeText={handleUsernameChange}
                placeholder="username"
                placeholderTextColor={colors.mutedLight}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.checkBtn, isChecking && styles.btnDisabled]}
                onPress={handleCheckUsername}
                disabled={isChecking}
                activeOpacity={0.85}
              >
                <Text style={styles.checkBtnText}>
                  {isChecking ? '확인 중...' : '중복확인'}
                </Text>
              </TouchableOpacity>
            </View>
            {usernameAvailable === true && username === checkedUsername && (
              <Text style={styles.successText}>사용 가능한 아이디입니다.</Text>
            )}
            {usernameAvailable === false && username === checkedUsername && (
              <Text style={styles.errorText}>이미 사용 중인 아이디입니다.</Text>
            )}
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

  row: {
    flexDirection: 'row',
    gap: 8,
  },
  rowInput: {
    flex: 1,
  },
  checkBtn: {
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  successText: {
    marginTop: 6,
    fontSize: 12,
    color: '#2E7D32',
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#C62828',
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
