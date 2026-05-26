import { apiClient } from './client';

// 사용자 정보 타입
export interface UserInfo {
  username: string;
  nickname: string;
  email: string;
}

// 내 정보 조회
export const getMyInfo = async (): Promise<UserInfo> => {
  const response = await apiClient.get<UserInfo>('/users/me');
  return response as any;
};
