import axios from 'axios';
import { getAccessToken } from '../utils/tokenStorage';

// API 베이스 URL 설정
// 개발/프로덕션 모두 배포된 서버 사용
export const API_BASE_URL = 'https://stayfit-back-api.ngelsh.com/api/v1';

// Axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 (인증 토큰 추가)
apiClient.interceptors.request.use(
  async (config) => {
    // 인증이 필요 없는 API 체크
    const isLoginAPI = config.url === '/auth/login';
    const isRefreshAPI = config.url === '/auth/refresh';
    const isSignupAPI = config.url === '/users' && config.method === 'post';

    const needsAuth = !isLoginAPI && !isRefreshAPI && !isSignupAPI;

    if (needsAuth) {
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ 토큰 헤더 추가됨:', config.url);
      } else {
        console.log('⚠️ 토큰 없음:', config.url);
      }
    } else {
      console.log('🔓 인증 불필요:', config.url);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 토큰 갱신 중인지 체크하는 플래그
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// 토큰 갱신 완료 후 대기 중인 요청들에게 알림
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// 토큰 갱신 대기열에 추가
const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// 응답 인터셉터 (에러 처리 + 토큰 갱신)
apiClient.interceptors.response.use(
  (response) => {
    // Spring Boot ApiResponse 형식 처리
    // { isSuccess: true, code: "OK", message: "...", result: {...} }
    if (response.data?.result !== undefined) {
      return response.data.result;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // refresh API 자체가 401 에러 나면 갱신 안 함 (무한 루프 방지)
    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    // 401 에러이고, 재시도 플래그가 없으면
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 이미 토큰 갱신 중이면 대기열에 추가
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // refresh token으로 새 토큰 발급
        const { getRefreshToken, saveAuthData, clearAuthData } = await import('../utils/tokenStorage');
        const { refreshToken: refreshTokenAPI } = await import('./auth');

        const oldRefreshToken = await getRefreshToken();

        if (!oldRefreshToken) {
          // refresh token이 없으면 로그아웃
          await clearAuthData();
          console.log('⚠️ Refresh token 없음. 다시 로그인 필요');
          return Promise.reject(error);
        }

        // 새 토큰 발급
        const response = await refreshTokenAPI(oldRefreshToken);
        await saveAuthData(response.accessToken, response.refreshToken);

        console.log('✅ 토큰 갱신 성공');

        // 대기 중인 요청들에게 새 토큰 전달
        onRefreshed(response.accessToken);

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // refresh token도 만료됨 - 로그아웃 처리
        const { clearAuthData } = await import('../utils/tokenStorage');
        await clearAuthData();
        console.log('⚠️ Refresh token 만료. 다시 로그인 필요');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 에러 처리
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      // Cloudflare Tunnel 에러 (530)
      if (status === 530 && data?.cloudflare_error) {
        console.error('🔴 Cloudflare Tunnel 에러:', data.title);
        console.error('   → 백엔드 서버가 일시적으로 연결 불가 상태입니다');
        console.error('   → 잠시 후 다시 시도해주세요');

        // 사용자 친화적인 에러 객체로 변환
        const userError = new Error('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
        (userError as any).isServerError = true;
        (userError as any).retryAfter = data.retry_after || 120;
        return Promise.reject(userError);
      }

      // 일반 API 에러
      console.error('API Error:', data);
    } else if (error.request) {
      console.error('Network Error:', error.message);
    }
    return Promise.reject(error);
  }
);
