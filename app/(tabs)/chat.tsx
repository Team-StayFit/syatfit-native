import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@/constants/tokens';

interface LLMResponse {
  financial_summary: { budget: number; ltv: number; dsr: number };
  properties: Array<{
    id: string; name: string; location: string;
    price: string; type: string; dsr: number; suitable: boolean;
  }>;
  loans: Array<{
    id: string; name: string; bank: string;
    rate: string; ltv_limit: number; max_amount: string;
  }>;
  reason: string;
}

type ChatState = 'empty' | 'streaming' | 'done';

const SUGGESTIONS = [
  '마포구 역세권 아파트 추천해줘',
  '전세 4억 이하 경기도 어때?',
  '매매 vs 전세 뭐가 유리해?',
];

const MOCK_RESPONSE: LLMResponse = {
  financial_summary: { budget: 51419, ltv: 70, dsr: 40 },
  properties: [
    { id: '1', name: '합정역 한강아파트', location: '마포구 합정동', price: '4억 2,000', type: '매매', dsr: 37.5, suitable: true },
    { id: '2', name: '망원동 나미엘', location: '마포구 망원동', price: '4억 9,000', type: '매매', dsr: 40.0, suitable: true },
    { id: '3', name: '상암 DMC 오피스텔', location: '마포구 상암동', price: '2억 8,000', type: '오피스텔', dsr: 35.2, suitable: true },
  ],
  loans: [
    { id: '1', name: '우리 아파트론', bank: '우리은행', rate: '3.5~4.2%', ltv_limit: 70, max_amount: '최대 5억' },
    { id: '2', name: '하나 청년 주택드림대출', bank: '하나은행', rate: '2.7~3.3%', ltv_limit: 80, max_amount: '최대 3억' },
  ],
  reason: '합정역 한강아파트가 학교·역세권·마트 접근성을 모두 만족해요. 망원동 나미엘은 평가 조망이 추가 장점이지만 DSR이 한도에 근접해요.',
};

const STREAM_PREFIX = `연 소득 6,000만원, 자산 2억, 부채 5,000만원 기준으로 분석한 거예요.\n\nDSR 40% 한도 내 최대 대출 3억 1,419만원, 실질 구매 가능 예산은 약 5억 1,419만원이에요.\n\n마포구 역세권 조건으로 매물 검색 중이에요...`;

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [chatState, setChatState] = useState<ChatState>('empty');
  const [userQuery, setUserQuery] = useState('');
  const [streamText, setStreamText] = useState('');
  const [llmData, setLlmData] = useState<LLMResponse | null>(null);
  const streamTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSend = (query: string) => {
    if (!query.trim()) return;
    setUserQuery(query);
    setChatState('streaming');
    setStreamText('');
    setLlmData(null);

    let idx = 0;
    const tick = () => {
      idx++;
      setStreamText(STREAM_PREFIX.slice(0, idx));
      if (idx < STREAM_PREFIX.length) {
        streamTimer.current = setTimeout(tick, 18);
      } else {
        setTimeout(() => {
          setLlmData(MOCK_RESPONSE);
          setChatState('done');
        }, 600);
      }
    };
    tick();
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
        style={styles.body}
        contentContainerStyle={chatState === 'empty' ? styles.emptyContent : styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {chatState === 'empty' && <EmptyState onSelect={handleSend} />}

        {(chatState === 'streaming' || chatState === 'done') && (
          <>
            {/* User bubble */}
            <View style={styles.userBubbleRow}>
              <View style={styles.userBubble}>
                <Text style={styles.userBubbleText}>{userQuery}</Text>
              </View>
            </View>

            {/* AI bubble */}
            <View style={styles.aiBubbleRow}>
              <View style={styles.aiAvatar}>
                <Text style={{ fontSize: 14 }}>✦</Text>
              </View>
              <View style={styles.aiContent}>
                <Text style={styles.aiName}>STAYFIT AI</Text>
                <View style={styles.aiBubble}>
                  <Text style={styles.aiText}>
                    {chatState === 'streaming' ? streamText : STREAM_PREFIX}
                    {chatState === 'streaming' && (
                      <Text style={styles.cursor}>|</Text>
                    )}
                  </Text>
                  {chatState === 'done' && llmData && (
                    <LLMResultCards data={llmData} />
                  )}
                </View>
              </View>
            </View>
          </>
        )}
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

function LLMResultCards({ data }: { data: LLMResponse }) {
  const { financial_summary, properties, loans, reason } = data;

  return (
    <View style={styles.resultWrap}>
      {/* 재무 요약 칩 */}
      <View style={styles.chipRow}>
        <View style={styles.chipItem}>
          <Text style={[styles.chipVal, { color: colors.mintText }]}>
            {(financial_summary.budget / 10000).toFixed(2)}억
          </Text>
          <Text style={styles.chipLbl}>구매 예산</Text>
        </View>
        <View style={styles.chipItem}>
          <Text style={styles.chipVal}>LTV {financial_summary.ltv}%</Text>
          <Text style={styles.chipLbl}>대출 한도</Text>
        </View>
        <View style={styles.chipItem}>
          <Text style={[styles.chipVal, { color: colors.warn }]}>
            DSR {financial_summary.dsr}%
          </Text>
          <Text style={styles.chipLbl}>상환 한도</Text>
        </View>
      </View>

      {/* 추천 매물 */}
      <Text style={styles.resultSect}>추천 매물</Text>
      <FlatList
        horizontal
        data={properties}
        keyExtractor={(i) => i.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.propScroll}
        scrollEnabled
        renderItem={({ item }) => (
          <View style={styles.miniPropCard}>
            <View style={[styles.miniPropImg, { backgroundColor: '#D0DBE8' }]}>
              <View style={styles.miniTag}>
                <Text style={styles.miniTagText}>{item.type}</Text>
              </View>
              <View style={styles.miniFit}>
                <Text style={styles.miniFitText}>✓ 적합</Text>
              </View>
            </View>
            <View style={styles.miniPropBody}>
              <Text style={styles.miniPropName}>{item.name}</Text>
              <Text style={styles.miniPropLoc}>{item.location}</Text>
              <Text style={styles.miniPropPrice}>{item.price}</Text>
              <Text style={styles.miniDsr}>DSR {item.dsr}%</Text>
            </View>
          </View>
        )}
      />

      {/* 추천 대출 */}
      <Text style={styles.resultSect}>추천 대출 상품</Text>
      {loans.map((l) => (
        <View key={l.id} style={styles.loanCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.loanName}>{l.name}</Text>
            <Text style={styles.loanType}>{l.bank} · LTV {l.ltv_limit}%</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.loanRate}>{l.rate}</Text>
            <Text style={styles.loanMax}>{l.max_amount}</Text>
          </View>
        </View>
      ))}

      {/* 추천 이유 */}
      <View style={styles.reasonBox}>
        <Text style={styles.reasonText}>{reason}</Text>
        <Text style={styles.reasonMore}>매물 상세 비교 보기 →</Text>
      </View>
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
  miniPropImg: { height: 78, position: 'relative' },
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
