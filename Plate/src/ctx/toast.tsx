import { createContext, use, useCallback, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Elevation, Fill, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { messageFromError } from '@/lib/api';

type Tone = 'neutral' | 'success' | 'error';

type Toast = { id: number; message: string; tone: Tone };

type ToastContextValue = {
  show: (message: string, tone?: Tone) => void;
  /** Convenience for mutation failures: renders the API's own message. */
  showError: (error: unknown, fallback?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const VISIBLE_MS = 4_000;

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  const show = useCallback((message: string, tone: Tone = 'neutral') => {
    if (!message) return;
    if (timer.current) clearTimeout(timer.current);
    nextId.current += 1;
    setToast({ id: nextId.current, message, tone });
    timer.current = setTimeout(() => setToast(null), VISIBLE_MS);
  }, []);

  const showError = useCallback(
    (error: unknown, fallback?: string) => show(messageFromError(error, fallback), 'error'),
    [show]
  );

  const value = useMemo(() => ({ show, showError }), [show, showError]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? <ToastView key={toast.id} toast={toast} /> : null}
    </ToastContext.Provider>
  );
}

function ToastView({ toast }: { toast: Toast }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const tones: Record<Tone, { background: string; text: string; icon: IconName }> = {
    neutral: { background: theme.surfaceElevated, text: theme.text, icon: 'info' },
    success: { background: theme.successWash, text: theme.success, icon: 'check-circle' },
    error: { background: theme.errorWash, text: theme.error, icon: 'warning' },
  };
  const palette = tones[toast.tone];

  return (
    <View
      pointerEvents="none"
      style={[styles.host, { paddingBottom: Math.max(insets.bottom, Spacing.three) + 84 }]}>
      <Animated.View
        entering={FadeInDown.duration(180)}
        exiting={FadeOutDown.duration(160)}
        accessibilityLiveRegion="polite"
        style={[
          styles.toast,
          Elevation.raised,
          { backgroundColor: palette.background, borderColor: theme.border },
        ]}>
        <Icon name={palette.icon} size={18} color={palette.text} />
        <AppText variant="small" color="text" style={styles.message}>
          {toast.message}
        </AppText>
      </Animated.View>
    </View>
  );
}

export function useToast() {
  const context = use(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

const styles = StyleSheet.create({
  host: {
    ...Fill,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  toast: {
    width: '100%',
    maxWidth: MaxContentWidth - Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three - 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  message: {
    flex: 1,
  },
});
