# STAYfit

> 내 재무 체력(소득·자산·부채)을 기반으로 실제 구매 가능한 부동산 매물을 추천하고, AI 채팅으로 탐색하는 모바일 앱

---

## 기술 스택

| 분류 | 라이브러리 | 버전 |
|------|-----------|------|
| Framework | React Native | 0.81.5 |
| Runtime | Expo | ~54.0.33 |
| Language | TypeScript | ~5.9.2 |
| Navigation | Expo Router (파일 기반) | ~6.0.23 |
| 전역 상태 | Jotai | ^2.20.0 |
| 서버 상태 | TanStack Query | ^5.100.10 |
| LLM 스트리밍 | Vercel AI SDK | ^6.0.184 |
| Safe Area | react-native-safe-area-context | ~5.6.0 |
| Screens | react-native-screens | ~4.16.0 |

### 예정 (네이티브 모듈 — `expo prebuild` 필요)

| 기능 | 라이브러리 |
|------|-----------|
| 카카오 로그인 | `@react-native-seoul/kakao-login` |
| Apple 로그인 | `@invertase/react-native-apple-authentication` |
| 카카오맵 | `react-native-webview` |
| 푸시 알림 | `expo-notifications` |

---

## 화면 구조

```
온보딩
├── /onboarding/intro            서비스 소개 + 핵심 기능 3가지
├── /onboarding/financial-profile  소득·자산·부채 입력 + 희망 지역 칩
└── /onboarding/login            카카오 / Apple / 네이버 / 비로그인

메인 탭
├── /(tabs)/                     홈 — 재무 체력 점수 + AI 배너 + 추천 매물
├── /(tabs)/chat                 AI 탐색 — 스트리밍 채팅 (empty / streaming / done)
├── /(tabs)/properties           매물 — 리스트/지도 토글 + 필터 칩
└── /(tabs)/my                   마이 — 프로필 + 재무 요약 + 관심 매물 + 설정
```

---

## 프로젝트 구조

```
stayfit/
├── app/
│   ├── _layout.tsx              루트 레이아웃 (QueryClientProvider)
│   ├── index.tsx                진입점 → /onboarding/intro 리다이렉트
│   ├── onboarding/
│   │   ├── intro.tsx
│   │   ├── financial-profile.tsx
│   │   └── login.tsx
│   └── (tabs)/
│       ├── _layout.tsx          탭 네비게이터
│       ├── index.tsx            홈
│       ├── chat.tsx             AI 탐색
│       ├── properties.tsx       매물
│       └── my.tsx               마이
├── atoms/
│   └── financialProfile.ts      재무 프로필 전역 상태 (Jotai)
├── constants/
│   ├── colors.ts                컬러 토큰
│   ├── tokens.ts                colors + radius + spacing
│   └── typography.ts            타이포그래피 스타일
├── types/
│   └── llm.ts                   LLM 응답 인터페이스
└── assets/
```

---

## 디자인 시스템

```ts
// constants/tokens.ts
colors.navy      = '#0C1F3F'   // 주 브랜드
colors.mint      = '#00C78C'   // 액센트
colors.bg        = '#F5F4F0'   // 앱 배경
colors.white     = '#FFFFFF'
colors.muted     = '#A0A8B4'
colors.warn      = '#D06B1A'

radius.md  = 16
radius.lg  = 20
radius.xl  = 24

spacing.lg = 20
spacing.xl = 24
```

---

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm start          # Expo Go
npm run android    # Android 에뮬레이터
npm run ios        # iOS 시뮬레이터
```

> 카카오 로그인·카카오맵 등 네이티브 모듈 사용 시 `expo prebuild` 후 dev client 빌드 필요

---

## LLM 응답 구조

```ts
interface LLMResponse {
  financial_summary: { budget: number; ltv: number; dsr: number };
  properties: Array<{
    name: string; location: string; price: number;
    dsr: number; type: '매매' | '전세' | '오피스텔'; suitable: boolean;
  }>;
  loans: Array<{
    name: string; bank: string; rate: string;
    ltv_limit: number; max_amount: number; type: '변동금리' | '고정금리';
  }>;
  reason: string; // 스트리밍 텍스트
}
```

- `reason` 필드만 스트리밍으로 표시
- 나머지는 JSON 완성 후 카드로 렌더링

---

## 앱 설정

| 항목 | 값 |
|------|---|
| Bundle ID (iOS) | `com.stayfit.app` |
| Package (Android) | `com.stayfit.app` |
| Scheme | `stayfit` |
| New Architecture | 활성화 |
| Splash 배경 | `#0C1F3F` (navy) |
