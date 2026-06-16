import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import { colors, radius, spacing } from '@/constants/tokens';
import { streamRecommendation, streamChatMessage } from '@/lib/api/aiClient';
import { useUserFinance } from '@/hooks/useUserFinance';
import type { UserFinanceResponse } from '@/lib/api/userFinance';
import { parseAiMarkdown, type ChipData, type LoanCard, type PropertyCard, type SectionCard } from '@/lib/utils/parseAiMarkdown';
import PropertyImagePlaceholder from '@/components/PropertyImagePlaceholder';

// 재무 데이터 포맷팅 (app/(tabs)/my.tsx와 동일한 표기 규칙)
const formatIncome = (income?: number) => {
  if (!income) return '미입력';
  return `${Math.floor(income / 10000)}만원`;
};

const formatAsset = (asset?: number) => {
  if (!asset) return '0원';
  const eok = Math.floor(asset / 100000000);
  const man = Math.floor((asset % 100000000) / 10000);
  if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만원`;
  if (eok > 0) return `${eok}억원`;
  return `${man.toLocaleString()}만원`;
};

// AI 추천 매물 카드의 거래 유형(매매/전세/월세) → 매물 상세 페이지 코드 매핑
const TRANSACTION_TYPE_MAP: Record<string, string> = {
  매매: 'TRADING',
  전세: 'LEASE',
  월세: 'RENT',
};

// AI 추천 매물 카드의 price 문자열(예: "38,000만 원 · 35.14㎡")에서
// 가격(만원)과 전용면적(㎡)을 추출
const parsePropertyPriceText = (priceText?: string) => {
  if (!priceText) return { price: undefined, exclusiveArea: undefined };
  const priceMatch = priceText.match(/([\d,]+)\s*만\s*원/);
  const areaMatch = priceText.match(/([\d.]+)\s*(?:㎡|m2|m²)/i);
  return {
    price: priceMatch ? Number(priceMatch[1].replace(/,/g, '')) : undefined,
    exclusiveArea: areaMatch ? Number(areaMatch[1]) : undefined,
  };
};

// AI 추천 매물 카드를 탭하면 상세 페이지로 이동 (AI 응답에 없는 필드는 비워둠)
const goToAiRecommendedProperty = (property: PropertyCard) => {
  const { price, exclusiveArea } = parsePropertyPriceText(property.price);
  router.push({
    pathname: '/property/[id]',
    params: {
      id: 'ai-recommend',
      propertyData: JSON.stringify({
        name: property.name,
        roadAddress: property.location || '',
        transactionType: TRANSACTION_TYPE_MAP[property.type || ''] || 'TRADING',
        price,
        monthlyRent: 0,
        exclusiveArea,
      }),
    },
  });
};

type ChatState = 'empty' | 'streaming' | 'done';

type Message = {
  id: string;
  type: 'user' | 'ai';
  content: string;
  isStreaming?: boolean;
};

const SUGGESTIONS = [
  '마포구 역세권 아파트 추천해줘', // 매물 추천
  'DSR이 뭐야?', // 일반 채팅
  '전세 4억 이하 경기도 어때?', // 매물 추천
];

// MOCK 데이터 (향후 필요시 사용)
// const MOCK_RESPONSE: LLMResponse = { ... };

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [chatState, setChatState] = useState<ChatState>('empty');
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamText, setStreamText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  // 재무 정보 가져오기
  const { data: financeData } = useUserFinance();

  // 스크롤을 맨 아래로 이동
  useEffect(() => {
    if (chatState !== 'empty') {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [streamText, chatState]);

  // 질문 유형 자동 감지
  const detectQueryType = (query: string): 'recommendation' | 'chat' => {
    const lowerQuery = query.toLowerCase();

    // 1. 질문형 키워드 우선 체크 (질문이면 일반 채팅)
    const questionKeywords = [
      '뭐야', '뭐', '무엇', '설명', '알려줘', '알려주',
      '어떻게', '왜', '이란', '뜻', '의미', '정의',
      '?', '??',
    ];
    const hasQuestionKeyword = questionKeywords.some(keyword =>
      lowerQuery.includes(keyword)
    );

    if (hasQuestionKeyword) {
      console.log('  → 질문형 키워드 감지, 일반 채팅으로 처리');
      return 'chat';
    }

    // 2. 부동산 매물 추천 키워드 체크 (더 정교하게)
    // 핵심 부동산 키워드 (이것들이 있어야 매물 추천으로 판단)
    const propertyKeywords = [
      '매물', '아파트', '집', '주택', '오피스텔', '빌라',
      '전세', '월세', '매매', '분양', '청약',
      '역세권', '학군', '신축', '평', '억', '만원',
      '부동산', '주거', '거주', '입주',
    ];

    // 보조 키워드 (부동산 키워드와 함께 있을 때만 의미 있음)
    const actionKeywords = ['추천', '구해', '찾아', '알아봐', '보여', '검색'];

    const hasPropertyKeyword = propertyKeywords.some(keyword =>
      lowerQuery.includes(keyword)
    );

    const hasActionKeyword = actionKeywords.some(keyword =>
      lowerQuery.includes(keyword)
    );

    // 부동산 키워드가 있거나, 부동산 키워드 + 액션 키워드 조합일 때만 추천
    if (hasPropertyKeyword) {
      console.log('  → 부동산 키워드 감지, 매물 추천으로 처리');
      return 'recommendation';
    }

    // 3. 기본값: 일반 채팅
    console.log('  → 기본값: 일반 채팅');
    return 'chat';
  };

  const handleSend = async (query: string) => {
    if (!query.trim()) return;

    // 사용자 메시지 추가
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
    };

    // AI 메시지 placeholder 추가
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: '',
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setChatState('streaming');
    setStreamText('');

    const queryType = detectQueryType(query);
    console.log('🔍 질문 유형:', queryType);

    try {
      if (queryType === 'recommendation') {
        // 매물 추천 API
        const annualIncome = financeData?.annual_income || 60000000;
        const assets = financeData?.capital || 200000000;
        const debt = financeData?.total_debt_amount || 50000000;
        const isHomeOwner = financeData?.is_home_owner || false;

        const requestData = {
          annual_income_man_won: Math.floor(annualIncome / 10000),
          assets_man_won: Math.floor(assets / 10000),
          existing_debt_man_won: Math.floor(debt / 10000),
          existing_annual_repayment_man_won: 0,
          is_home_owner: isHomeOwner,
          lifestyle_keywords: query,
          loan_rate_pct: 4,
          loan_term_years: 30,
          occupation: '일반',
          preferences: {
            transaction_type: 'TRADING',
            property_type: 'APT',
            parking_required: true,
          },
          preferred_area: '마포구',
          top_k: 5,
        };

        console.log('🏠 매물 추천 API 호출');

        await streamRecommendation(
          requestData,
          (chunk) => {
            setStreamText((prev) => {
              // \x00 마커는 전체 교체를 의미
              const newText = chunk.startsWith('\x00') ? chunk.substring(1) : prev + chunk;
              // 메시지 배열도 동시에 업데이트
              setMessages((msgs) =>
                msgs.map((msg) =>
                  msg.id === aiMessage.id ? { ...msg, content: newText } : msg
                )
              );
              return newText;
            });
          },
          () => {
            setChatState('done');
            // AI 메시지 스트리밍 완료
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessage.id ? { ...msg, isStreaming: false } : msg
              )
            );
          },
          (error) => {
            console.error('AI stream error:', error);
            const errorMsg = '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.';
            setStreamText(errorMsg);
            setChatState('done');
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessage.id
                  ? { ...msg, content: errorMsg, isStreaming: false }
                  : msg
              )
            );
          }
        );
      } else {
        // 일반 채팅 API
        console.log('💬 일반 채팅 API 호출');

        await streamChatMessage(
          query,
          (chunk) => {
            setStreamText((prev) => {
              const newText = prev + chunk;
              // 메시지 배열도 동시에 업데이트
              setMessages((msgs) =>
                msgs.map((msg) =>
                  msg.id === aiMessage.id ? { ...msg, content: newText } : msg
                )
              );
              return newText;
            });
          },
          () => {
            setChatState('done');
            // AI 메시지 스트리밍 완료
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessage.id ? { ...msg, isStreaming: false } : msg
              )
            );
          },
          (error) => {
            console.error('AI stream error:', error);
            const errorMsg = '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.';
            setStreamText(errorMsg);
            setChatState('done');
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessage.id
                  ? { ...msg, content: errorMsg, isStreaming: false }
                  : msg
              )
            );
          }
        );
      }
    } catch (error) {
      console.error('Failed to start stream:', error);
      const errorMsg = '죄송합니다. 서버에 연결할 수 없습니다.';
      setStreamText(errorMsg);
      setChatState('done');
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessage.id
            ? { ...msg, content: errorMsg, isStreaming: false }
            : msg
        )
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>AI 탐색</Text>
          <Text style={styles.headerSub}>
            {chatState === 'streaming' ? '응답 생성 중...' : '재무 체력 기반 맞춤 검색'}
          </Text>
        </View>
        <View style={[styles.dot, chatState === 'streaming' && styles.dotPulse]} />
      </View>

      {/* Body */}
      <ScrollView
        ref={scrollRef}
        style={styles.body}
        contentContainerStyle={messages.length === 0 ? styles.emptyContent : styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && <EmptyState onSelect={handleSend} />}

        {messages.map((message) => {
          if (message.type === 'user') {
            return (
              <View key={message.id} style={styles.userBubbleRow}>
                <View style={styles.userBubble}>
                  <Text style={styles.userBubbleText}>{message.content}</Text>
                </View>
              </View>
            );
          } else {
            // AI message
            const displayText = message.isStreaming ? streamText : message.content;
            // 스트리밍 중에도 1./2./3. 섹션과 표를 실시간으로 칩/카드 UI로 구조화해서 보여줌
            const parsed = displayText ? parseAiMarkdown(displayText) : null;
            return (
              <View key={message.id} style={styles.aiBubbleRow}>
                <View style={styles.aiAvatar}>
                  <Text style={{ fontSize: 14 }}>✦</Text>
                </View>
                <View style={styles.aiContent}>
                  <Text style={styles.aiName}>STAYFIT AI</Text>
                  <View style={styles.aiBubble}>
                    {displayText && parsed ? (
                      <>
                        {(parsed.properties.length > 0 || parsed.loans.length > 0) && (
                          <FinanceSummaryRow financeData={financeData} />
                        )}
                        {!!parsed.text && (
                          <Markdown style={markdownStyles} rules={markdownRules}>
                            {parsed.text}
                          </Markdown>
                        )}
                        {parsed.chips.length > 0 && (
                          <ChipsRow chips={parsed.chips} />
                        )}
                        {parsed.properties.length > 0 && (
                          <PropertyCards properties={parsed.properties} />
                        )}
                        {parsed.loans.length > 0 && (
                          <LoanCards loans={parsed.loans} />
                        )}
                        {parsed.sections.length > 0 && (
                          <SectionCards sections={parsed.sections} />
                        )}
                        {/* 카드/칩으로 추출되지 않은 내용이 있으면(또는 스트리밍 초반) 원문을 그대로 표시 */}
                        {!parsed.text &&
                          parsed.properties.length === 0 &&
                          parsed.loans.length === 0 &&
                          parsed.sections.length === 0 && (
                            <Markdown style={markdownStyles} rules={markdownRules}>
                              {displayText}
                            </Markdown>
                          )}
                        {message.isStreaming && (
                          <Text style={styles.cursor}>|</Text>
                        )}
                      </>
                    ) : (
                      <Text style={styles.aiText}>응답을 생성하고 있습니다...</Text>
                    )}
                  </View>
                </View>
              </View>
            );
          }
        })}
      </ScrollView>

      {/* Input bar */}
      <InputBar
        disabled={chatState === 'streaming'}
        onSend={handleSend}
        insets={insets}
      />
    </KeyboardAvoidingView>
  );
}

function EmptyState({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIco}>
        <Text style={{ fontSize: 28 }}>🏠</Text>
      </View>
      <Text style={styles.emptyTitle}>무엇이든 물어보세요</Text>
      <Text style={styles.emptyDesc}>
        내 소득과 자산을 바탕으로{'\n'}살 수 있는 매물을 찾아드려요
      </Text>
      <View style={styles.suggList}>
        {SUGGESTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            style={styles.suggItem}
            onPress={() => onSelect(s)}
            activeOpacity={0.75}
          >
            <Text style={styles.suggText}>{s}</Text>
            <Text style={styles.suggArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// 매물/대출 추천 응답 상단에 내 재무 상황(연소득/보유자산/부채)을 표시
function FinanceSummaryRow({ financeData }: { financeData?: UserFinanceResponse }) {
  return (
    <View style={styles.financeSummary}>
      <Text style={styles.financeSummaryTitle}>내 재무 상황</Text>
      <View style={styles.financeSummaryRow}>
        <View style={styles.financeSummaryItem}>
          <Text style={styles.financeSummaryVal}>{formatIncome(financeData?.annual_income)}</Text>
          <Text style={styles.financeSummaryLbl}>연소득</Text>
        </View>
        <View style={styles.financeSummaryDivider} />
        <View style={styles.financeSummaryItem}>
          <Text style={styles.financeSummaryVal}>{formatAsset(financeData?.capital)}</Text>
          <Text style={styles.financeSummaryLbl}>보유자산</Text>
        </View>
        <View style={styles.financeSummaryDivider} />
        <View style={styles.financeSummaryItem}>
          <Text style={styles.financeSummaryVal}>{formatAsset(financeData?.total_debt_amount)}</Text>
          <Text style={styles.financeSummaryLbl}>부채</Text>
        </View>
      </View>
    </View>
  );
}

// AI 응답에서 추출한 요약 칩 (구매예산 / LTV / DSR 등)
function ChipsRow({ chips }: { chips: ChipData[] }) {
  return (
    <View style={styles.chipRow}>
      {chips.map((chip) => (
        <View key={chip.label} style={styles.chipItem}>
          <Text style={styles.chipVal}>{chip.value}</Text>
          <Text style={styles.chipLbl}>{chip.label}</Text>
        </View>
      ))}
    </View>
  );
}

// AI 응답에서 추출한 추천 매물 카드 (가로 스크롤)
function PropertyCards({ properties }: { properties: PropertyCard[] }) {
  return (
    <View style={styles.resultWrap}>
      <Text style={styles.resultSect}>추천 매물</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.propScroll}
      >
        {properties.map((p, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.miniPropCard}
            activeOpacity={0.85}
            onPress={() => goToAiRecommendedProperty(p)}
          >
            <View style={styles.miniPropImg}>
              <PropertyImagePlaceholder size={26} style={StyleSheet.absoluteFill} />
              {!!p.type && (
                <View style={styles.miniTag}>
                  <Text style={styles.miniTagText}>{p.type}</Text>
                </View>
              )}
              {!!p.fit && (
                <View style={styles.miniFit}>
                  <Text style={styles.miniFitText}>{p.fit}</Text>
                </View>
              )}
            </View>
            <View style={styles.miniPropBody}>
              <Text style={styles.miniPropName} numberOfLines={1}>{p.name}</Text>
              {!!p.location && (
                <Text style={styles.miniPropLoc} numberOfLines={1}>{p.location}</Text>
              )}
              {!!p.price && <Text style={styles.miniPropPrice}>{p.price}</Text>}
              {!!p.dsr && <Text style={styles.miniDsr}>DSR {p.dsr}</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// AI 응답에서 추출한 추천 대출 상품 목록
function LoanCards({ loans }: { loans: LoanCard[] }) {
  return (
    <View style={styles.resultWrap}>
      <Text style={styles.resultSect}>추천 대출 상품</Text>
      {loans.map((l, idx) => (
        <View key={idx} style={styles.loanCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.loanName}>{l.name}</Text>
            {!!l.bankInfo && <Text style={styles.loanType}>{l.bankInfo}</Text>}
          </View>
          <View>
            {!!l.rate && <Text style={styles.loanRate}>{l.rate}</Text>}
            {!!l.maxAmount && <Text style={styles.loanMax}>{l.maxAmount}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}

// AI 응답의 "N. 종합 의견 / 유의사항" 등 그 외 번호 섹션을 제목+본문 카드로 표시
function SectionCards({ sections }: { sections: SectionCard[] }) {
  return (
    <View style={styles.resultWrap}>
      {sections.map((s, idx) => (
        <View key={idx} style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>{s.title}</Text>
          {!!s.body && (
            <Markdown style={sectionMarkdownStyles} rules={markdownRules}>
              {s.body}
            </Markdown>
          )}
        </View>
      ))}
    </View>
  );
}

function InputBar({
  disabled, onSend, insets,
}: {
  disabled: boolean;
  onSend: (q: string) => void;
  insets: { bottom: number };
}) {
  const [text, setText] = useState('');
  return (
    <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder={disabled ? '응답 생성 중...' : '어떤 집을 찾고 계세요?'}
          placeholderTextColor={colors.mutedLight}
          editable={!disabled}
          returnKeyType="send"
          onSubmitEditing={() => {
            if (text.trim()) { onSend(text); setText(''); }
          }}
        />
        <TouchableOpacity
          style={[styles.sendBtn, disabled && styles.sendBtnOff]}
          onPress={() => {
            if (text.trim() && !disabled) { onSend(text); setText(''); }
          }}
          disabled={disabled}
          activeOpacity={0.8}
        >
          {disabled
            ? <Text style={{ fontSize: 14 }}>⏹</Text>
            : <Text style={styles.sendArrow}>↑</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.lg, paddingBottom: 15,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: colors.white, letterSpacing: -0.4 },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 },
  dot: { width: 8, height: 8, backgroundColor: colors.mint, borderRadius: 4 },
  dotPulse: { opacity: 0.5 },

  body: { flex: 1 },
  emptyContent: { flex: 1 },
  chatContent: { padding: 15, paddingBottom: 20 },

  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyIco: {
    width: 56, height: 56, backgroundColor: '#EBF0FA',
    borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17, fontWeight: '800', color: colors.navy,
    letterSpacing: -0.5, marginBottom: 7,
  },
  emptyDesc: {
    fontSize: 13, color: colors.muted, lineHeight: 20,
    textAlign: 'center', marginBottom: 26,
  },
  suggList: { width: '100%', gap: 8 },
  suggItem: {
    backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.border,
    borderRadius: 13, padding: 13, paddingHorizontal: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  suggText: { fontSize: 13, color: colors.navy },
  suggArrow: { fontSize: 13, color: colors.muted },

  userBubbleRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 13 },
  userBubble: {
    backgroundColor: colors.navy, borderRadius: 17, borderBottomRightRadius: 4,
    padding: 12, paddingHorizontal: 14, maxWidth: '80%',
  },
  userBubbleText: { fontSize: 13, color: colors.white, lineHeight: 20, letterSpacing: -0.2 },

  aiBubbleRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  aiAvatar: {
    width: 31, height: 31, backgroundColor: colors.mint,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 2,
  },
  aiContent: { flex: 1, minWidth: 0 },
  aiName: {
    fontSize: 10, fontWeight: '700', color: colors.muted,
    letterSpacing: 0.4, marginBottom: 5,
  },
  aiBubble: {
    backgroundColor: colors.white, borderRadius: 4,
    borderTopRightRadius: 17, borderBottomRightRadius: 17, borderBottomLeftRadius: 17,
    padding: 13, borderWidth: 0.5, borderColor: colors.border,
  },
  aiText: { fontSize: 13, color: colors.navy, lineHeight: 21 },
  cursor: { fontSize: 13, color: colors.mint },

  financeSummary: {
    backgroundColor: colors.navy, borderRadius: 12,
    padding: 12, marginBottom: 12,
  },
  financeSummaryTitle: {
    fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8,
  },
  financeSummaryRow: { flexDirection: 'row', alignItems: 'center' },
  financeSummaryItem: { flex: 1, alignItems: 'center' },
  financeSummaryVal: { fontSize: 13, fontWeight: '800', color: colors.white, letterSpacing: -0.3 },
  financeSummaryLbl: { fontSize: 9.5, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  financeSummaryDivider: { width: 0.5, height: 24, backgroundColor: 'rgba(255,255,255,0.15)' },

  resultWrap: { marginTop: 12 },
  chipRow: { flexDirection: 'row', gap: 7, marginBottom: 12 },
  chipItem: {
    flex: 1, backgroundColor: '#F8F7F3',
    borderRadius: 11, padding: 9, alignItems: 'center',
  },
  chipVal: { fontSize: 13, fontWeight: '800', color: colors.navy, letterSpacing: -0.4 },
  chipLbl: { fontSize: 9.5, color: colors.muted, marginTop: 1 },

  resultSect: {
    fontSize: 10, fontWeight: '700', color: colors.muted,
    letterSpacing: 0.6, textTransform: 'uppercase',
    marginBottom: 7, marginTop: 2,
  },

  propScroll: { gap: 9, paddingRight: 4, marginBottom: 12 },
  miniPropCard: {
    width: 140, backgroundColor: colors.white,
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 0.5, borderColor: colors.border,
  },
  miniPropImg: { height: 78, position: 'relative', backgroundColor: colors.cardBg, overflow: 'hidden' },
  miniTag: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: colors.navy, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  miniTagText: { fontSize: 9, fontWeight: '700', color: colors.white },
  miniFit: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: colors.mintLight, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  miniFitText: { fontSize: 9, fontWeight: '700', color: colors.mintText },
  miniPropBody: { padding: 10 },
  miniPropName: { fontSize: 11.5, fontWeight: '700', color: colors.navy, marginBottom: 2 },
  miniPropLoc: { fontSize: 9.5, color: colors.muted, marginBottom: 5 },
  miniPropPrice: { fontSize: 11.5, fontWeight: '800', color: colors.navy },
  miniDsr: { fontSize: 9.5, color: colors.mint, fontWeight: '700', marginTop: 1 },

  loanCard: {
    backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.border,
    borderRadius: 12, padding: 11, paddingHorizontal: 13,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 7,
  },
  loanName: { fontSize: 12, fontWeight: '700', color: colors.navy, marginBottom: 2 },
  loanType: { fontSize: 9.5, color: colors.muted },
  loanRate: { fontSize: 13, fontWeight: '800', color: colors.navy, textAlign: 'right' },
  loanMax: { fontSize: 9.5, color: colors.muted, textAlign: 'right' },

  sectionCard: {
    backgroundColor: '#F8F7F3', borderWidth: 0.5, borderColor: colors.border,
    borderRadius: 12, padding: 12, marginBottom: 7,
  },
  sectionCardTitle: {
    fontSize: 11, fontWeight: '700', color: colors.muted,
    letterSpacing: 0.3, marginBottom: 4,
  },

  reasonBox: {
    backgroundColor: '#F0FAF6', borderWidth: 0.5,
    borderColor: 'rgba(0,199,140,0.25)', borderRadius: 12,
    padding: 12, marginTop: 2,
  },
  reasonText: { fontSize: 12, color: colors.navy, lineHeight: 19 },
  reasonMore: { fontSize: 11, color: colors.mintText, fontWeight: '700', marginTop: 6 },

  inputBar: {
    backgroundColor: colors.white, borderTopWidth: 0.5,
    borderTopColor: colors.border, paddingHorizontal: 15, paddingTop: 10,
  },
  inputWrap: {
    backgroundColor: colors.bg, borderRadius: 15,
    paddingHorizontal: 13, paddingVertical: 11,
    flexDirection: 'row', alignItems: 'center', gap: 9,
  },
  textInput: { flex: 1, fontSize: 13, color: colors.navy },
  sendBtn: {
    width: 33, height: 33, backgroundColor: colors.navy,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: '#E2DED6' },
  sendArrow: { fontSize: 16, color: colors.white, fontWeight: '700' },
});

// 마크다운 스타일
const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 13,
    color: colors.navy,
    lineHeight: 21,
  },
  heading1: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.navy,
    marginTop: 8,
    marginBottom: 6,
  },
  heading2: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navy,
    marginTop: 7,
    marginBottom: 5,
  },
  heading3: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
    marginTop: 6,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 13,
    color: colors.navy,
    lineHeight: 21,
    marginTop: 2,
    marginBottom: 2,
  },
  listItem: {
    fontSize: 13,
    color: colors.navy,
    lineHeight: 21,
    marginBottom: 3,
  },
  strong: {
    fontWeight: '700',
    color: colors.navy,
  },
  em: {
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: '#F5F5F5',
    color: colors.mintText,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  fence: {
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 8,
    marginVertical: 6,
  },
  code_block: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.navy,
  },
  hr: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: 10,
  },
  // 표(table) 스타일
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginVertical: 8,
    overflow: 'hidden',
  },
  thead: {
    backgroundColor: colors.navy,
  },
  tbody: {},
  tr: {
    borderBottomWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
  },
  th: {
    flex: 1,
    minWidth: 90,
    padding: 8,
  },
  td: {
    flex: 1,
    minWidth: 90,
    padding: 8,
  },
});

// SectionCards 본문(종합 의견/유의사항 등)용 마크다운 스타일 - aiBubble 본문보다 한 단계 작게
const sectionMarkdownStyles = StyleSheet.create({
  body: { fontSize: 12, color: colors.navy, lineHeight: 19 },
  paragraph: { fontSize: 12, color: colors.navy, lineHeight: 19, marginTop: 0, marginBottom: 0 },
  listItem: { fontSize: 12, color: colors.navy, lineHeight: 19, marginBottom: 2 },
  strong: { fontWeight: '700', color: colors.navy },
  em: { fontStyle: 'italic' },
});

// 표(table) 헤더/셀 텍스트 스타일 (커스텀 렌더 규칙에서 사용)
const tableTextStyles = StyleSheet.create({
  th: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
    lineHeight: 17,
  },
  td: {
    fontSize: 12,
    color: colors.navy,
    lineHeight: 17,
  },
  scroll: {
    marginVertical: 4,
  },
});

// 마크다운 커스텀 렌더 규칙 (표를 가로 스크롤 가능하게 + 헤더/셀 텍스트 스타일 적용)
const markdownRules = {
  table: (node: any, children: any, parent: any, styles: any) => (
    <ScrollView
      key={node.key}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={tableTextStyles.scroll}
    >
      <View style={styles._VIEW_SAFE_table}>{children}</View>
    </ScrollView>
  ),
  th: (node: any, children: any, parent: any, styles: any) => (
    <View key={node.key} style={styles._VIEW_SAFE_th}>
      <Text style={tableTextStyles.th}>{children}</Text>
    </View>
  ),
  td: (node: any, children: any, parent: any, styles: any) => (
    <View key={node.key} style={styles._VIEW_SAFE_td}>
      <Text style={tableTextStyles.td}>{children}</Text>
    </View>
  ),
};
