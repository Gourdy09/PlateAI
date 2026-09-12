import { Pressable, StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { CartItem } from '@/api/types';

/** One shopping-list line. Checking it writes straight through to MongoDB. */
export function CartItemRow({
  item,
  onToggle,
  onRemove,
  onPress,
  busy = false,
}: {
  item: CartItem;
  onToggle: () => void;
  onRemove: () => void;
  onPress?: () => void;
  busy?: boolean;
}) {
  const theme = useTheme();
  const amount = [item.quantity, item.unit].filter(Boolean).join(' ').trim();

  return (
    <View style={[styles.row, { borderColor: theme.border, backgroundColor: theme.card }]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.checked }}
        accessibilityLabel={`${item.checked ? 'Uncheck' : 'Check'} ${item.name}`}
        onPress={onToggle}
        disabled={busy}
        hitSlop={6}
        style={[
          styles.checkbox,
          {
            borderColor: item.checked ? theme.primary : theme.borderStrong,
            backgroundColor: item.checked ? theme.primary : 'transparent',
          },
        ]}>
        {item.checked ? <Icon name="check" size={14} color={theme.onPrimary} strokeWidth={2.6} /> : null}
      </Pressable>

      <Pressable
        style={styles.body}
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={onPress ? `Edit ${item.name}` : undefined}>
        <AppText
          variant="body"
          color={item.checked ? 'textTertiary' : 'text'}
          style={item.checked ? styles.checkedText : undefined}
          numberOfLines={2}>
          {item.name}
        </AppText>
        {amount || item.note ? (
          <AppText variant="caption" color="textSecondary" numberOfLines={2}>
            {[amount, item.note].filter(Boolean).join(' · ')}
          </AppText>
        ) : null}
      </Pressable>

      <IconButton
        name="close"
        size={34}
        variant="plain"
        color={theme.textTertiary}
        onPress={onRemove}
        accessibilityLabel={`Remove ${item.name}`}
        disabled={busy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two + 2,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  checkedText: {
    textDecorationLine: 'line-through',
  },
});
