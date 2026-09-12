import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from '@/ctx/auth';
import { QueryProvider } from '@/ctx/query';
import { AppThemeProvider, useAppTheme } from '@/ctx/theme';
import { ToastProvider } from '@/ctx/toast';
import { VoiceProvider } from '@/ctx/voice';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: 'index',
};

function SplashController() {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  return null;
}

function RootNavigator() {
  const { session } = useAuth();
  const { scheme, colors } = useAppTheme();

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

  // Keep the signed-out stack available while the session restores so Expo
  // Router always has a real destination. If both guards are false it can fall
  // through to /redirect and trip a setState-before-mount in the linker.
  const authed = !!session;
  const signedOut = !session;

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <SplashController />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" options={{ animation: 'none' }} />
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <QueryProvider>
          {/* Theme reads the saved appearance from the API, so it sits inside the query provider. */}
          <AppThemeProvider>
            <VoiceProvider>
              <ToastProvider>
                <RootNavigator />
              </ToastProvider>
            </VoiceProvider>
          </AppThemeProvider>
        </QueryProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
