import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, useRootNavigationState } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { useAuth } from '@/ctx/auth';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

/**
 * Auth0 callback landing page.
 * Only used when Auth0 returns here with ?code= / ?error=.
 */
export default function AuthRedirectScreen() {
  const theme = useTheme();
  const navigationState = useRootNavigationState();
  const { session, isLoading, finishOAuthRedirect } = useAuth();
  const params = useLocalSearchParams<{
    code?: string | string[];
    error?: string | string[];
    error_description?: string | string[];
  }>();
  const [message, setMessage] = useState('Finishing sign in…');
  const [failed, setFailed] = useState(false);
  const handled = useRef(false);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const code = Array.isArray(params.code) ? params.code[0] : params.code;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const errorDescription = Array.isArray(params.error_description)
    ? params.error_description[0]
    : params.error_description;

  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  useEffect(() => {
    if (handled.current || !navigationState?.key || isLoading) return;

    // Already signed in (promptAsync finished first) — leave immediately.
    if (session && !code && !error) {
      handled.current = true;
      setTimeout(() => router.replace('/(app)/(tabs)'), 0);
      return;
    }

    if (!code && !error) {
      handled.current = true;
      setTimeout(() => router.replace('/'), 0);
      return;
    }

    handled.current = true;

    let cancelled = false;

    const run = async () => {
      try {
        // promptAsync may already have created the session with this code.
        if (sessionRef.current) {
          router.replace('/(app)/(tabs)');
          return;
        }

        await finishOAuthRedirect({
          code,
          error,
          error_description: errorDescription,
        });
        if (cancelled) return;

        await new Promise((resolve) => setTimeout(resolve, 50));
        if (cancelled) return;

        // Even when exchange was a no-op, promptAsync may already have signed us in.
        router.replace('/(app)/(tabs)');
      } catch (err) {
        if (cancelled) return;
        // Duplicate exchange after a successful promptAsync — treat as success.
        if (sessionRef.current) {
          router.replace('/(app)/(tabs)');
          return;
        }
        setFailed(true);
        setMessage(err instanceof Error ? err.message : 'Sign in failed');
      }
    };

    const timeout = setTimeout(run, 50);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [
    code,
    error,
    errorDescription,
    finishOAuthRedirect,
    isLoading,
    navigationState?.key,
    session,
  ]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {!failed ? <ActivityIndicator color={theme.primary} /> : null}
      <Text style={[styles.text, { color: theme.textSecondary }]}>{message}</Text>
      {failed ? (
        <Pressable
          onPress={() => {
            setFailed(false);
            setTimeout(() => router.replace('/(auth)/login'), 0);
          }}
          hitSlop={12}
          style={styles.linkWrap}>
          <Text style={[styles.link, { color: theme.primary }]}>Back to sign in</Text>
        </Pressable>
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
  linkWrap: {
    marginTop: Spacing.two,
    padding: Spacing.two,
  },
  link: {
    fontSize: 15,
    fontWeight: '600',
  },
});
