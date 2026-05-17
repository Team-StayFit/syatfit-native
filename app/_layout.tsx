import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/constants/colors';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" backgroundColor={colors.navy} />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
