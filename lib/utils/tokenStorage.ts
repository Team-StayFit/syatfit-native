import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'stayfit_accessToken';
const REFRESH_TOKEN_KEY = 'stayfit_refreshToken';
const USER_ID_KEY = 'stayfit_userId';

// 액세스 토큰 저장
export const setAccessToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to save access token:', error);
    throw error;
  }
};

// 액세스 토큰 조회
export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
};

// 리프레시 토큰 저장
export const setRefreshToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to save refresh token:', error);
    throw error;
  }
};

// 리프레시 토큰 조회
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get refresh token:', error);
    return null;
  }
};

// 사용자 ID 저장
export const setUserId = async (userId: number): Promise<void> => {
  try {
    await SecureStore.setItemAsync(USER_ID_KEY, userId.toString());
  } catch (error) {
    console.error('Failed to save user ID:', error);
    throw error;
  }
};

// 사용자 ID 조회
export const getUserId = async (): Promise<number | null> => {
  try {
    const userId = await SecureStore.getItemAsync(USER_ID_KEY);
    return userId ? parseInt(userId, 10) : null;
  } catch (error) {
    console.error('Failed to get user ID:', error);
    return null;
  }
};

// 모든 인증 정보 저장
export const saveAuthData = async (
  accessToken: string,
  refreshToken: string,
  userId?: number
): Promise<void> => {
  try {
    const promises = [
      setAccessToken(accessToken),
      setRefreshToken(refreshToken),
    ];

    // userId가 있으면 저장
    if (userId !== undefined) {
      promises.push(setUserId(userId));
    }

    await Promise.all(promises);
  } catch (error) {
    console.error('Failed to save auth data:', error);
    throw error;
  }
};

// 모든 인증 정보 삭제 (로그아웃 시)
export const clearAuthData = async (): Promise<void> => {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_ID_KEY),
    ]);
  } catch (error) {
    console.error('Failed to clear auth data:', error);
    throw error;
  }
};

// 인증 상태 확인
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAccessToken();
  return !!token;
};
