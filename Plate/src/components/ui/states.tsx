import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { messageFromError } from '@/lib/api';

/**
 * Loading, empty, and failure are first-class states everywhere. A screen never
 * shows a blank area or fabricated content while a request is pending or failed.
 */
export function LoadingState({ label = 'Loading…', compact = false }: { label?: string; compact?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.centered, compact ? styles.compact : null]}>
      <ActivityIndicator color={theme.primary} />
      <AppText variant="small" color="textSecondary" align="center">
        {label}
      </AppText>
    </View>
  );
}

export function ErrorState({
  error,
  fallback = 'Something went wrong.',
  onRetry,
  retryLabel = 'Try again',
  compact = false,
}: {
  error: unknown;
  fallback?: string;
  onRetry?: () => void;
  retryLabel?: string;
  compact?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.centered, compact ? styles.compact : null]}>
      <View style={[styles.badge, { backgroundColor: theme.errorWash }]}>
        <Icon name="warning" size={22} color={theme.error} />
      </View>
      <AppText variant="bodyStrong" align="center">
        {messageFromError(error, fallback)}
      </AppText>
      {onRetry ? (
        <Button label={retryLabel} onPress={onRetry} variant="secondary" size="sm" fullWidth={false} />
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon = 'utensils',
  title,
  description,
  action,
  secondaryAction,
  style,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void; icon?: IconName };
  secondaryAction?: { label: string; onPress: () => void; icon?: IconName };
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.centered, style]}>
      <View style={[styles.badge, { backgroundColor: theme.accentWash }]}>
        <Icon name={icon} size={24} color={theme.accent} />
      </View>
      <AppText variant="heading" align="center" style={{ alignSelf: 'stretch', width: '100%' }}>
        {title}
      </AppText>
      {description ? (
        <AppText variant="small" color="textSecondary" align="center" style={styles.description}>
          {description}
        </AppText>
      ) : null}
      {action ? (
        <Button
          label={action.label}
          icon={action.icon}
          onPress={action.onPress}
          fullWidth={false}
          size="sm"
        />
      ) : null}
      {secondaryAction ? (
        <Button
          label={secondaryAction.label}
          icon={secondaryAction.icon}
          onPress={secondaryAction.onPress}
          variant="ghost"
          fullWidth={false}
          size="sm"
        />
      ) : null}
    </View>
  );
}

type NoticeTone = 'info' | 'warning' | 'error' | 'success';

/** Inline banner for honest status messages, such as an unavailable integration. */
export function Notice({
  tone = 'info',
  title,
  message,
  icon,
  action,
}: {
  tone?: NoticeTone;
  title?: string;
  message: string;
  icon?: IconName;
  action?: { label: string; onPress: () => void };
}) {
  const theme = useTheme();

  const tones: Record<NoticeTone, { background: string; accent: string; icon: IconName }> = {
    info: { background: theme.accentWash, accent: theme.accent, icon: 'info' },
    warning: { background: theme.warningWash, accent: theme.warning, icon: 'warning' },
    error: { background: theme.errorWash, accent: theme.error, icon: 'warning' },
    success: { background: theme.successWash, accent: theme.success, icon: 'check-circle' },
  };
  const palette = tones[tone];

  return (
    <View style={[styles.notice, { backgroundColor: palette.background }]}>
      <Icon name={icon ?? palette.icon} size={18} color={palette.accent} />
      <View style={styles.noticeBody}>
        {title ? (
          <AppText variant="bodyStrong" tint={palette.accent}>
            {title}
          </AppText>
        ) : null}
        <AppText variant="small" color="text">
          {message}
        </AppText>
        {action ? (
          <Button
            label={action.label}
            onPress={action.onPress}
            variant="ghost"
            size="sm"
            fullWidth={false}
            style={styles.noticeAction}
          />
        ) : null}
      </View>
    </View>
  );
}

export function Skeleton({
  height = 16,
  width = '100%',
  radius = Radius.sm,
  style,
}: {
  height?: number;
  width?: number | `${number}%`;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View
      style={[{ height, width, borderRadius: radius, backgroundColor: theme.skeleton }, style]}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.three,
  },
  compact: {
    flex: 0,
    paddingVertical: Spacing.four,
    gap: Spacing.two,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    maxWidth: 300,
  },
  notice: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  noticeBody: {
    flex: 1,
    gap: 4,
  },
  noticeAction: {
    paddingHorizontal: 0,
    height: 32,
    alignSelf: 'flex-start',
  },
});
