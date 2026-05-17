# stayfit — 프로젝트 컨텍스트

## 프로젝트 개요
내 재무 상태(소득·자산·부채)를 기반으로 실제 구매 가능한 부동산 매물을 추천하고, LLM 채팅으로 탐색하는 모바일 앱.

## 기술 스택
- **Framework**: React Native + Expo (bare workflow 또는 Expo + dev client)
  - 이유: 카카오 로그인 네이티브 모듈, 푸시 알림 필요
- **Navigation**: Expo Router (파일 기반 라우팅)
- **State**: Jotai (재무 프로필, 필터 조건 등 글로벌 상태)
- **Server State**: TanStack Query (매물/대출 상품 API 캐싱)
- **LLM Streaming**: Vercel AI SDK (`useChat` 훅)
- **Analytics**: Mixpanel + GA4

## 디자인 시스템

### 컬러 토큰
```ts
export const colors = {
  navy: '#0C1F3F',       // 주 브랜드, 헤더, 버튼, 버블
  mint: '#00C78C',       // 액센트, AI 아바타, 적합 뱃지
  mintLight: '#E4FAF3',  // 적합 뱃지 배경
  mintText: '#00A876',   // 적합 텍스트
  bg: '#F5F4F0',         // 앱 배경
  white: '#FFFFFF',
  border: '#EAE7E0',
  muted: '#A0A8B4',
  inputBg: '#F5F4F0',
  warn: '#D06B1A',
};
```

### 타이포그래피
- **Font**: Pretendard (또는 시스템 폰트 fallback)
- **H1**: 34px, weight 800, letterSpacing -1.2
- **H2**: 25px, weight 800, letterSpacing -0.8
- **Body**: 13~14px, weight 400, lineHeight 1.65
- **Label**: 11px, weight 700, letterSpacing 0.8, UPPERCASE
- **Caption**: 10~11px, weight 400

### 주요 컴포넌트 패턴
- **카드**: white bg, 1px border (#EAE7E0), borderRadius 18
- **Primary 버튼**: navy bg, white text, borderRadius 16, padding 19
- **칩/뱃지**: borderRadius 24, border 0.5px

## 화면 구조 (IA)

```
온보딩
├── OnboardingIntro     ← 서비스 소개 + 핵심 기능 3가지
├── FinancialProfile    ← 소득·자산·부채 입력 + 희망 지역 칩
└── Login               ← 카카오 / Apple / 네이버 / 비로그인

메인 탭 (Expo Router tabs)
├── HomeScreen          ← 재무 체력 점수 카드 + AI 탐색 배너 + 추천 매물
├── ChatScreen          ← AI 탐색 채팅 (3가지 상태)
├── PropertyListScreen  ← 매물 리스트/지도 (카카오맵 WebView)
└── MyScreen            ← 재무 정보 + 관심 매물 + 설정
```

## LLM 출력 → UI 렌더링 구조

백엔드 LLM은 JSON으로 응답. 프론트에서 각 키를 컴포넌트에 매핑.

```ts
interface LLMResponse {
  financial_summary: {
    budget: number;      // 실질 구매 예산 (만원)
    ltv: number;         // LTV %
    dsr: number;         // DSR %
  };
  properties: Array<{
    name: string;
    location: string;
    price: number;       // 만원
    dsr: number;         // 이 매물 구매 시 DSR %
    type: '매매' | '전세' | '오피스텔';
    suitable: boolean;   // 재무 체력 적합 여부
  }>;
  loans: Array<{
    name: string;
    bank: string;
    rate: string;        // '3.5~4.2%'
    ltv_limit: number;   // LTV 한도 %
    max_amount: number;  // 최대 대출액 (만원)
    type: '변동금리' | '고정금리';
  }>;
  reason: string;        // 추천 이유 텍스트 (스트리밍)
}
```

**렌더링 전략**:
- `reason` 필드만 스트리밍 텍스트로 표시
- 나머지(financial_summary, properties, loans)는 JSON 완성 후 카드로 렌더링
- 스트리밍 중: 입력창 비활성화, 헤더 dot pulse 애니메이션

## 소셜 로그인 구현 계획
- 카카오: `@react-native-seoul/kakao-login`
- Apple: `@invertase/react-native-apple-authentication`
- 네이버: WebView OAuth 리다이렉트
- Expo managed workflow → 네이티브 모듈 때문에 `expo prebuild` 필요

## 주요 구현 주의사항
1. Expo managed에서 카카오 로그인 모듈 사용 시 dev client 빌드 필요
2. 카카오맵은 WebView로 감싸서 사용 (`react-native-webview`)
3. 푸시 알림: `expo-notifications` (시세 변동, 추천 업데이트)
4. LLM 스트리밍: Vercel AI SDK `useChat` or 직접 fetch + ReadableStream
5. ScrollView horizontal로 매물 카드 가로 스크롤 구현
