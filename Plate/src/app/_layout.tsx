import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { AuthProvider, useAuth } from '@/ctx/auth';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

function SplashController() {
  const { isLoading } = useAuth();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!isLoading && navigationState?.key) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading, navigationState?.key]);

  return null;
}

function RootNavigator() {
  const { session, isLoading } = useAuth();
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'unspecified' ? 'light' : colorScheme ?? 'light';
  const colors = Colors[scheme];

  const navTheme = {
    ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.inputBorder,
      primary: colors.primary,
    },
  };

  // Avoid flipping protected stacks until session restore finishes. This keeps
  // Expo Router's linking from updating an unmounted navigator on cold start.
  const authed = !isLoading && !!session;
  const signedOut = !isLoading && !session;

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <SplashController />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="redirect" options={{ animation: 'none' }} />
        <Stack.Protected guard={authed}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={signedOut}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
