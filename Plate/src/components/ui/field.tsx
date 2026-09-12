import { forwardRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { IconButton } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string | null;
  icon?: IconName;
  right?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, hint, error, icon, right, containerStyle, multiline, style, ...inputProps },
  ref
) {
  const theme = useTheme();
  return (
    <View style={[styles.field, containerStyle]}>
      {label ? <AppText variant="bodyStrong">{label}</AppText> : null}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: theme.input,
            borderColor: error ? theme.error : theme.inputBorder,
            minHeight: multiline ? 96 : 54,
            alignItems: multiline ? 'flex-start' : 'center',
            paddingVertical: multiline ? Spacing.two + 4 : 0,
          },
        ]}>
        {icon ? <Icon name={icon} size={18} color={theme.textSecondary} /> : null}
        <TextInput
          ref={ref}
          multiline={multiline}
          placeholderTextColor={theme.textTertiary}
          style={[styles.input, { color: theme.text }, multiline ? styles.inputMultiline : null, style]}
          {...inputProps}
        />
        {right}
      </View>
      {error ? (
        <AppText variant="caption" tint={theme.error}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color="textSecondary">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
});

export function ToggleRow({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.row, disabled ? styles.disabled : null]}>
      <View style={styles.rowText}>
        <AppText variant="body">{label}</AppText>
        {description ? (
          <AppText variant="caption" color="textSecondary">
            {description}
          </AppText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ true: theme.primary, false: theme.borderStrong }}
        thumbColor={theme.surfaceElevated}
        ios_backgroundColor={theme.borderStrong}
      />
    </View>
  );
}

/** Tappable settings row. Shows the current value and a chevron. */
export function OptionRow({
  label,
  value,
  description,
  icon,
  onPress,
  destructive = false,
  showChevron = true,
}: {
  label: string;
  value?: string;
  description?: string;
  icon?: IconName;
  onPress: () => void;
  destructive?: boolean;
  showChevron?: boolean;
}) {
  const theme = useTheme();
  const tint = destructive ? theme.error : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? { opacity: 0.7 } : null]}>
      {icon ? <Icon name={icon} size={19} color={destructive ? theme.error : theme.textSecondary} /> : null}
      <View style={styles.rowText}>
        <AppText variant="body" tint={tint}>
          {label}
        </AppText>
        {description ? (
          <AppText variant="caption" color="textSecondary">
            {description}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="small" color="textSecondary" numberOfLines={1} style={styles.rowValue}>
          {value}
        </AppText>
      ) : null}
      {showChevron ? <Icon name="chevron-right" size={17} color={theme.textTertiary} /> : null}
    </Pressable>
  );
}

export function Stepper({
  label,
  value,
  onChange,
  min = 1,
  max = 24,
  suffix,
  disabled = false,
}: {
  label?: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  disabled?: boolean;
}) {
  return (
    <View style={styles.stepper}>
      {label ? (
        <AppText variant="body" style={styles.stepperLabel}>
          {label}
        </AppText>
      ) : null}
      <View style={styles.stepperControls}>
        <IconButton
          name="minus"
          size={38}
          accessibilityLabel={`Decrease ${label ?? 'value'}`}
          onPress={() => onChange(Math.max(min, value - 1))}
          disabled={disabled || value <= min}
        />
        <AppText variant="bodyStrong" align="center" style={styles.stepperValue}>
          {value}
          {suffix ? ` ${suffix}` : ''}
        </AppText>
        <IconButton
          name="plus"
          size={38}
          accessibilityLabel={`Increase ${label ?? 'value'}`}
          onPress={() => onChange(Math.min(max, value + 1))}
          disabled={disabled || value >= max}
        />
      </View>
    </View>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: theme.surfaceSunken, borderColor: theme.border }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              selected ? { backgroundColor: theme.surfaceElevated, borderColor: theme.border } : null,
            ]}>
            <AppText
              variant="small"
              tint={selected ? theme.text : theme.textSecondary}
              align="center"
              numberOfLines={1}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  inputRow: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
    lineHeight: 21,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 52,
    paddingVertical: Spacing.two,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowValue: {
    maxWidth: 140,
  },
  disabled: {
    opacity: 0.55,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  stepperLabel: {
    flex: 1,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepperValue: {
    minWidth: 64,
  },
  segmented: {
    flexDirection: 'row',
    padding: 3,
    gap: 3,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
