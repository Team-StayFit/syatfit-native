import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSetAtom } from 'jotai';
import { colors, radius, spacing } from '@/constants/tokens';
import { useMyInfo, useUpdateMyInfo, useDeleteAccount } from '@/hooks/useUser';
import { clearAuthData } from '@/lib/utils/tokenStorage';
import { queryClient } from '@/lib/queryClient';
import { financialProfileAtom } from '@/atoms/financialProfile';

export default function ProfileEditScreen() {
  const { data: userInfo, isLoading } = useMyInfo();
  const { mutate: updateMyInfo, isPending: isUpdating } = useUpdateMyInfo();
  const { mutate: deleteAccount, isPending: isDeleting } = useDeleteAccount();
  const setFinancialProfile = useSetAtom(financialProfileAtom);

  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (userInfo) {
      setNickname(userInfo.nickname || '');
      setEmail(userInfo.email || '');
    }
  }, [userInfo]);

  const handleSave = () => {
    if (nickname.length < 4) {
      Alert.alert('알림', '닉네임은 최소 4자 이상이어야 합니다.');
      return;
    }
    if (!email) {
      Alert.alert('알림', '이메일을 입력해주세요.');
      return;
    }

    updateMyInfo(
      { nickname, email },
      {
        onSuccess: () => {
          Alert.alert('완료', '내 정보가 수정되었습니다.', [
            { text: '확인', onPress: () => router.back() },
          ]);
        },
        onError: (error: any) => {
          console.error('내 정보 수정 실패:', error);
          const message = error.response?.data?.message || '내 정보 수정에 실패했습니다.';
          Alert.alert('오류', message);
        },
      }
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '회원 탈퇴',
      '정말 탈퇴하시겠습니까?\n탈퇴 시 모든 정보가 삭제되며 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: () => {
            deleteAccount(undefined, {
              onSuccess: async () => {
                await clearAuthData();
                queryClient.clear();
                setFinancialProfile({ income: 0, assets: 0, debt: 0, regions: [], pendingFinance: undefined });
                Alert.alert('완료', '회원 탈퇴가 처리되었습니다.', [
                  { text: '확인', onPress: () => router.replace('/onboarding/login') },
                ]);
              },
              onError: (error: any) => {
                console.error('회원 탈퇴 실패:', error);
                const message = error.response?.data?.message || '회원 탈퇴에 실패했습니다.';
                Alert.alert('오류', message);
              },
            });
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.navy} />
        </View>
      </SafeAreaView>
    );
  }

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
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>← 뒤로</Text>
          </TouchableOpacity>

          <Text style={styles.title}>내 정보 수정</Text>
          <Text style={styles.subtitle}>닉네임과 이메일을 수정할 수 있어요</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>아이디</Text>
            <View style={[styles.input, styles.inputDisabled]}>
              <Text style={styles.inputDisabledText}>{userInfo?.username}</Text>
            </View>
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

          <TouchableOpacity
            style={[styles.btnPrimary, isUpdating && styles.btnDisabled]}
            onPress={handleSave}
            disabled={isUpdating}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>
              {isUpdating ? '저장 중...' : '저장하기'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteBtn, isDeleting && styles.btnDisabled]}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteBtnText}>
              {isDeleting ? '처리 중...' : '회원 탈퇴'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  inputDisabled: {
    backgroundColor: colors.cardBg,
  },
  inputDisabledText: {
    fontSize: 15,
    color: colors.muted,
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

  deleteBtn: {
    marginTop: 20,
    alignItems: 'center',
    padding: 14,
  },
  deleteBtnText: {
    fontSize: 13,
    color: '#C62828',
    fontWeight: '600',
  },
});
