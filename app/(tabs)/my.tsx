import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

export default function MyScreen() {
  return (
    <View style={styles.container}>
      <Text style={[typography.h2, styles.title]}>마이</Text>
      {/* TODO: 재무 정보 + 관심 매물 + 설정 */}
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
