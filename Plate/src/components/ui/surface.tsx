import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Elevation, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Card({
  children,
  style,
  onPress,
  padded = true,
  elevated = true,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padded?: boolean;
  elevated?: boolean;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  const base: StyleProp<ViewStyle> = [
    styles.card,
    {
      backgroundColor: theme.card,
      borderColor: theme.border,
      padding: padded ? Spacing.three : 0,
    },
    elevated ? Elevation.card : null,
    style,
  ];

  if (!onPress) return <View style={base}>{children}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [base, pressed ? { opacity: 0.88 } : null]}>
      {children}
    </Pressable>
  );
}

export function Section({
  title,
  subtitle,
  action,
  children,
  style,
}: {
  title?: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.section, style]}>
      {title || action ? (
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeadings}>
            {title ? <AppText variant="heading">{title}</AppText> : null}
            {subtitle ? (
              <AppText variant="small" color="textSecondary">
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {action ? (
            <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={8}>
              <AppText variant="bodyStrong" tint={theme.primary}>
                {action.label}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.divider }, style]} />;
}

type ChipTone = 'neutral' | 'accent' | 'warning' | 'error' | 'success';

export function Chip({
  label,
  selected = false,
  onPress,
  icon,
  tone = 'neutral',
  size = 'md',
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  tone?: ChipTone;
  size?: 'md' | 'sm';
}) {
  const theme = useTheme();

  const tones: Record<ChipTone, { background: string; text: string; border: string }> = {
    neutral: { background: theme.chip, text: theme.text, border: theme.border },
    accent: { background: theme.accentWash, text: theme.accent, border: theme.accentWash },
    warning: { background: theme.warningWash, text: theme.warning, border: theme.warningWash },
    error: { background: theme.errorWash, text: theme.error, border: theme.errorWash },
    success: { background: theme.successWash, text: theme.success, border: theme.successWash },
  };

  const palette = selected
    ? { background: theme.primary, text: theme.onPrimary, border: theme.primary }
    : tones[tone];

  const content = (
    <>
      {icon ? <Icon name={icon} size={size === 'sm' ? 13 : 15} color={palette.text} /> : null}
      <AppText variant={size === 'sm' ? 'caption' : 'small'} tint={palette.text} numberOfLines={1}>
        {label}
      </AppText>
    </>
  );

  const chipStyle: StyleProp<ViewStyle> = [
    styles.chip,
    {
      backgroundColor: palette.background,
      borderColor: palette.border,
      paddingVertical: size === 'sm' ? 5 : 8,
      paddingHorizontal: size === 'sm' ? 10 : 14,
    },
  ];

  if (!onPress) return <View style={chipStyle}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [chipStyle, pressed ? { opacity: 0.85 } : null]}>
      {content}
    </Pressable>
  );
}

/** Horizontally scrollable chip group used for filters and tag lists. */
export function ChipScroller({
  children,
  contentStyle,
}: {
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.chipScroller, contentStyle]}>
      {children}
    </ScrollView>
  );
}

export function ChipWrap({ children }: { children: React.ReactNode }) {
  return <View style={styles.chipWrap}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  section: {
    gap: Spacing.three,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  sectionHeadings: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipScroller: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
