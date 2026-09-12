import { createContext, use, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useSettings } from '@/api/use-account';
import { Colors, type ThemeColors } from '@/constants/theme';
import type { ThemeMode } from '@/api/types';

/**
 * Appearance follows the phone by default. A saved preference of 'light' or
 * 'dark' overrides it; 'system' (the default) tracks the OS. Until settings load
 * from MongoDB the system scheme is used, so there is no flash of the wrong theme.
 */
type AppThemeValue = {
  scheme: 'light' | 'dark';
  colors: ThemeColors;
  mode: ThemeMode;
  systemScheme: 'light' | 'dark';
};

const AppThemeContext = createContext<AppThemeValue | null>(null);

function normalizeSystemScheme(scheme: ReturnType<typeof useSystemColorScheme>) {
  return scheme === 'dark' ? 'dark' : 'light';
}

export function AppThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = normalizeSystemScheme(useSystemColorScheme());
  const { data: settings } = useSettings();
  const mode: ThemeMode = settings?.theme ?? 'system';

  const value = useMemo<AppThemeValue>(() => {
    const scheme = mode === 'system' ? systemScheme : mode;
    return { scheme, colors: Colors[scheme], mode, systemScheme };
  }, [mode, systemScheme]);

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

/**
 * Usable outside the provider too — the auth screens render before settings
 * exist, and they should simply follow the system scheme.
 */
export function useAppTheme(): AppThemeValue {
  const context = use(AppThemeContext);
  const systemScheme = normalizeSystemScheme(useSystemColorScheme());
  if (context) return context;
  return { scheme: systemScheme, colors: Colors[systemScheme], mode: 'system', systemScheme };
}
