import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, useRootNavigationState } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { useAuth } from '@/ctx/auth';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

/**
 * Auth0 callback landing page.
 * Completes OAuth when ?code= is present, then leaves this route.
 */
export default function AuthRedirectScreen() {
  const theme = useTheme();
  const navigationState = useRootNavigationState();
  const params = useLocalSearchParams<{
    code?: string | string[];
    error?: string | string[];
    error_description?: string | string[];
  }>();
  const { finishOAuthRedirect } = useAuth();
  const [message, setMessage] = useState('Finishing sign in…');
  const [failed, setFailed] = useState(false);
  const handled = useRef(false);

  const code = Array.isArray(params.code) ? params.code[0] : params.code;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const errorDescription = Array.isArray(params.error_description)
    ? params.error_description[0]
    : params.error_description;

  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  useEffect(() => {
    if (handled.current || !navigationState?.key) return;
    handled.current = true;

    let cancelled = false;

    const run = async () => {
      try {
        const completed = await finishOAuthRedirect({
          code,
          error,
          error_description: errorDescription,
        });
        if (cancelled) return;

        // Wait a tick so NavigationContainer is fully mounted before replace.
        await new Promise((resolve) => setTimeout(resolve, 50));
        if (cancelled) return;

        router.replace(completed ? '/' : '/(auth)/login');
      } catch (err) {
        if (cancelled) return;
        setFailed(true);
        setMessage(err instanceof Error ? err.message : 'Sign in failed');
      }
    };

    const timeout = setTimeout(run, 50);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [code, error, errorDescription, finishOAuthRedirect, navigationState?.key]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {!failed ? <ActivityIndicator color={theme.primary} /> : null}
      <Text style={[styles.text, { color: theme.textSecondary }]}>{message}</Text>
      {failed ? (
        <Text
          style={[styles.link, { color: theme.primary }]}
          onPress={() => {
            setTimeout(() => router.replace('/(auth)/login'), 0);
          }}>
          Back to sign in
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  text: {
    fontSize: 15,
    textAlign: 'center',
  },
  link: {
    marginTop: Spacing.two,
    fontSize: 15,
    fontWeight: '600',
  },
});
