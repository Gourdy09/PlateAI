import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Buttons that mirror the swipe gestures, for anyone who prefers tapping. */
export function SwipeActions({
  onPass,
  onSave,
  onUndo,
  onOpen,
  disabled = false,
  canUndo = false,
  undoing = false,
}: {
  onPass: () => void;
  onSave: () => void;
  onUndo: () => void;
  onOpen: () => void;
  disabled?: boolean;
  canUndo?: boolean;
  undoing?: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.side}>
        <IconButton
          name="undo"
          size={44}
          onPress={onUndo}
          accessibilityLabel="Undo last swipe"
          disabled={!canUndo || undoing}
          loading={undoing}
        />
      </View>

      <View style={styles.center}>
        <IconButton
          name="close"
          size={58}
          onPress={onPass}
          accessibilityLabel="Pass on this recipe"
          disabled={disabled}
          color={theme.textSecondary}
        />
        <IconButton
          name="heart"
          size={64}
          variant="primary"
          onPress={onSave}
          accessibilityLabel="Save this recipe"
          disabled={disabled}
        />
      </View>

      <View style={[styles.side, styles.sideEnd]}>
        <IconButton
          name="book"
          size={44}
          onPress={onOpen}
          accessibilityLabel="Open recipe details"
          disabled={disabled}
        />
      </View>
    </View>
  );
}

export function SwipeHint() {
  return (
    <AppText variant="caption" color="textTertiary" align="center">
      Swipe right to save, left to pass, or tap the card for the full recipe.
    </AppText>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  side: {
    width: 56,
    alignItems: 'flex-start',
  },
  sideEnd: {
    alignItems: 'flex-end',
  },
  center: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
});
