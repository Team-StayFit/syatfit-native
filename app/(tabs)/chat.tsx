import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={[typography.h2, styles.title]}>AI 탐색</Text>
      {/* TODO: useChat 훅 + 3가지 상태 (idle/streaming/complete) */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 64,
    padding: 20,
  },
  title: {
    color: colors.navy,
  },
});
