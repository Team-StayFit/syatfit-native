import { Tabs } from 'expo-router';
import { colors } from '@/constants/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '홈' }} />
      <Tabs.Screen name="chat" options={{ title: 'AI 탐색' }} />
      <Tabs.Screen name="properties" options={{ title: '매물' }} />
      <Tabs.Screen name="my" options={{ title: '마이' }} />
    </Tabs>
  );
}
