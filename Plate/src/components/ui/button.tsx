import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  /** Shows a spinner and blocks input while a real request is in flight. */
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const palette: Record<Variant, { background: string; pressed: string; text: string; border?: string }> =
    {
      primary: {
        background: theme.primary,
        pressed: theme.primaryPressed,
        text: theme.onPrimary,
      },
      secondary: {
        background: theme.surface,
        pressed: theme.backgroundSelected,
        text: theme.text,
        border: theme.borderStrong,
      },
      ghost: {
        background: 'transparent',
        pressed: theme.backgroundSelected,
        text: theme.primary,
      },
      danger: {
        background: theme.errorWash,
        pressed: theme.errorWash,
        text: theme.error,
        border: theme.error,
      },
    };

  const tone = palette[variant];
  const height = size === 'sm' ? 44 : 54;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          backgroundColor: pressed ? tone.pressed : tone.background,
          borderColor: tone.border ?? 'transparent',
          borderWidth: tone.border ? 1 : 0,
          opacity: isDisabled ? 0.55 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          paddingHorizontal: fullWidth ? Spacing.three : Spacing.four,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={tone.text} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' ? (
            <Icon name={icon} size={size === 'sm' ? 17 : 19} color={tone.text} />
          ) : null}
          <AppText
            variant="bodyStrong"
            tint={tone.text}
            style={size === 'md' ? styles.mdLabel : undefined}
            numberOfLines={1}>
            {label}
          </AppText>
          {icon && iconPosition === 'right' ? (
            <Icon name={icon} size={size === 'sm' ? 17 : 19} color={tone.text} />
          ) : null}
        </>
      )}
    </Pressable>
  );
}

type IconButtonProps = {
  name: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: 'surface' | 'plain' | 'primary';
  size?: number;
  filled?: boolean;
  color?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  variant = 'surface',
  size = 44,
  filled = false,
  color,
  disabled = false,
  loading = false,
  style,
}: IconButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const background =
    variant === 'surface' ? theme.surface : variant === 'primary' ? theme.primary : 'transparent';
  const tint = color ?? (variant === 'primary' ? theme.onPrimary : theme.text);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: pressed && variant !== 'plain' ? theme.backgroundSelected : background,
          borderWidth: variant === 'surface' ? 1 : 0,
          borderColor: theme.border,
          opacity: isDisabled ? 0.5 : pressed && variant === 'plain' ? 0.6 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={tint} />
      ) : (
        <Icon name={name} size={Math.round(size * 0.46)} color={tint} filled={filled} />
      )}
    </Pressable>
  );
}

/** A row of buttons that share the available width evenly. */
export function ButtonRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  mdLabel: {
    fontSize: 16,
    fontWeight: Type.bodyStrong.fontWeight,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
