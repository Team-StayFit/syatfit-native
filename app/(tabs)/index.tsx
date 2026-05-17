import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={[typography.h2, styles.greeting]}>안녕하세요</Text>
      {/* TODO: 재무 체력 점수 카드 */}
      {/* TODO: AI 탐색 배너 */}
      {/* TODO: 추천 매물 가로 스크롤 */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 20,
    paddingTop: 64,
  },
  greeting: {
    color: colors.navy,
    marginBottom: 24,
  },
});
