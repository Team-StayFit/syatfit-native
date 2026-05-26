import { useMutation } from '@tanstack/react-query';
import { signup, login, logout, SignupRequest, LoginRequest } from '@/lib/api/auth';
import { saveAuthData, clearAuthData } from '@/lib/utils/tokenStorage';

// 회원가입 훅
export const useSignup = () => {
  return useMutation({
    mutationFn: (data: SignupRequest) => signup(data),
  });
};

// 로그인 훅
export const useLogin = () => {
  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await login(data);
      console.log('✅ 로그인 성공');

      // 자동으로 토큰 저장 (userId는 백엔드에서 안 보내줌)
      await saveAuthData(
        response.accessToken,
        response.refreshToken
      );
      console.log('✅ 토큰 저장 완료');
      return response;
    },
  });
};

// 로그아웃 훅
export const useLogout = () => {
  return useMutation({
    mutationFn: async () => {
      await logout();
      // 로컬 토큰 삭제
      await clearAuthData();
    },
  });
};
