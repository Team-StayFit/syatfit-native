import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

export default function PropertyListScreen() {
  return (
    <View style={styles.container}>
      <Text style={[typography.h2, styles.title]}>매물</Text>
      {/* TODO: 리스트/지도 토글 + 카카오맵 WebView */}
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
