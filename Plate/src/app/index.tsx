import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/ctx/auth';
import { useTheme } from '@/hooks/use-theme';

/**
 * App entry. Navigation waits until this screen has mounted so Expo Router's
 * linking layer is not asked to change routes in the same frame it is created.
 */
export default function Index() {
  const theme = useTheme();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (session?.tokens?.accessToken && session.user) {
      router.replace('/(app)/(tabs)');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isLoading, session]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.background,
      }}>
      <ActivityIndicator color={theme.primary} />
    </View>
  );
}
