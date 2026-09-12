import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useSettings } from '@/api/use-account';

/** Haptics, gated on the user's saved preference. Silent on web. */
export function useHaptics() {
  const { data: settings } = useSettings();
  const enabled = (settings?.hapticsEnabled ?? true) && Platform.OS !== 'web';

  const impact = useCallback(
    (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
      if (!enabled) return;
      Haptics.impactAsync(style).catch(() => {});
    },
    [enabled]
  );

  const notify = useCallback(
    (type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) => {
      if (!enabled) return;
      Haptics.notificationAsync(type).catch(() => {});
    },
    [enabled]
  );

  return {
    tap: useCallback(() => impact(Haptics.ImpactFeedbackStyle.Light), [impact]),
    press: useCallback(() => impact(Haptics.ImpactFeedbackStyle.Medium), [impact]),
    success: useCallback(() => notify(Haptics.NotificationFeedbackType.Success), [notify]),
    warn: useCallback(() => notify(Haptics.NotificationFeedbackType.Warning), [notify]),
  };
}
