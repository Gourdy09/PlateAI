import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { useAuth } from '@/ctx/auth';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

// Close Auth0 popup windows (web) as soon as this module loads.
WebBrowser.maybeCompleteAuthSession();

/**
 * Auth0 callback landing page.
 * - Popup flow: maybeCompleteAuthSession closes this window; opener continues.
 * - Full-page / deep-link flow: exchange ?code= here, then leave for home/login.
 */
export default function AuthRedirectScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    code?: string | string[];
    error?: string | string[];
    error_description?: string | string[];
  }>();
  const { session, isLoading, finishOAuthRedirect } = useAuth();
  const [message, setMessage] = useState('Finishing sign in…');
  const [failed, setFailed] = useState(false);
  const handled = useRef(false);

  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  useEffect(() => {
    if (handled.current || isLoading) return;
    handled.current = true;

    let active = true;
    (async () => {
      try {
        const completed = await finishOAuthRedirect(params);
        if (!active) return;
        if (completed || session) {
          router.replace('/');
          return;
        }
        router.replace('/(auth)/login');
      } catch (error) {
        if (!active) return;
        setFailed(true);
        setMessage(error instanceof Error ? error.message : 'Sign in failed');
      }
    })();

    return () => {
      active = false;
    };
  }, [finishOAuthRedirect, isLoading, params, session]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {!failed ? <ActivityIndicator color={theme.primary} /> : null}
      <Text style={[styles.text, { color: theme.textSecondary }]}>{message}</Text>
      {failed ? (
        <Text
          style={[styles.link, { color: theme.primary }]}
          onPress={() => router.replace('/(auth)/login')}>
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
