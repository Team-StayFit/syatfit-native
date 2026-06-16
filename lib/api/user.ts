import { apiClient } from './client';

// 사용자 정보 타입
export interface UserInfo {
  username: string;
  nickname: string;
  email: string;
}

// 내 정보 수정 요청 데이터
export interface UpdateUserRequest {
  nickname: string;
  email: string;
}

// 회원 탈퇴 응답 데이터
export interface DeleteUserResponse {
  username: string;
  message: string;
  deletedAt: string;
}

// 내 정보 조회
export const getMyInfo = async (): Promise<UserInfo> => {
  const response = await apiClient.get<UserInfo>('/users/me');
  return response as any;
};

// 내 정보 수정
export const updateMyInfo = async (data: UpdateUserRequest): Promise<UserInfo> => {
  const response = await apiClient.patch<UserInfo>('/users/me', data);
  return response as any;
};

// 회원 탈퇴
export const deleteMyAccount = async (): Promise<DeleteUserResponse> => {
  const response = await apiClient.delete<DeleteUserResponse>('/users/me');
  return response as any;
};
