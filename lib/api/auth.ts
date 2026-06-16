import { apiClient } from './client';

// 회원가입 요청 데이터
export interface SignupRequest {
  email: string;
  username: string;
  nickname: string;
  password: string;
}

// 회원가입 응답 데이터
export interface SignupResponse {
  user_id: number;
  email: string;
  username: string;
  nickname: string;
  created_at: string;
}

// 로그인 요청 데이터
export interface LoginRequest {
  email: string;
  password: string;
}

// 로그인 응답 데이터
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

// 회원가입
export const signup = async (data: SignupRequest): Promise<SignupResponse> => {
  const response = await apiClient.post<SignupResponse>('/users', data);
  return response as any;
};

// 아이디(username) 중복 확인
export const checkUsernameExists = async (username: string): Promise<boolean> => {
  const response = await apiClient.post<boolean>('/users/exists', { username });
  return response as any;
};

// 로그인
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login', data);
  return response as any;
};

// 로그아웃
export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};

// 토큰 갱신
export const refreshToken = async (refreshToken: string): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/refresh', { refreshToken });
  return response as any;
};
