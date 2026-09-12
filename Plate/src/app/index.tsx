import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useAuth } from '@/ctx/auth';
import { useTheme } from '@/hooks/use-theme';

/** App entry — never leave cold start stranded on /redirect. */
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

  if (session) return <Redirect href="/(app)" />;
  return <Redirect href="/(auth)/login" />;
}
