import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useAuth } from '@/ctx/auth';
import { useTheme } from '@/hooks/use-theme';

/** App entry — route to home when logged in, otherwise login. */
export default function Index() {
  const theme = useTheme();
  const { session, isLoading } = useAuth();

  if (isLoading) {
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

  if (session?.tokens?.accessToken && session.user) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
