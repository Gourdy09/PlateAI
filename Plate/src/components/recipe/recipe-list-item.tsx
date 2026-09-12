import { StyleSheet, View } from 'react-native';

import { RecipeCover } from '@/components/recipe/recipe-cover';
import { IconButton } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Card } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Recipe } from '@/api/types';

/** Compact recipe row used by Saved, history, and fridge results. */
export function RecipeListItem({
  recipe,
  onPress,
  onRemove,
  removeLabel = 'Remove from saved',
  trailing,
  note,
}: {
  recipe: Recipe;
  onPress: () => void;
  onRemove?: () => void;
  removeLabel?: string;
  trailing?: React.ReactNode;
  note?: string;
}) {
  const theme = useTheme();

  return (
    <Card onPress={onPress} accessibilityLabel={recipe.title} padded={false} style={styles.card}>
      <View style={styles.row}>
        <RecipeCover recipe={recipe} style={styles.cover} compact />
        <View style={styles.body}>
          <AppText variant="bodyStrong" numberOfLines={2}>
            {recipe.title}
          </AppText>
          <View style={styles.metaRow}>
            <Icon name="clock" size={13} color={theme.textSecondary} />
            <AppText variant="caption" color="textSecondary">
              {recipe.totalTime} min
            </AppText>
            <AppText variant="caption" color="textTertiary">
              ·
            </AppText>
            <AppText variant="caption" color="textSecondary">
              {recipe.difficulty}
            </AppText>
            {recipe.cuisine ? (
              <>
                <AppText variant="caption" color="textTertiary">
                  ·
                </AppText>
                <AppText variant="caption" color="textSecondary" numberOfLines={1}>
                  {recipe.cuisine}
                </AppText>
              </>
            ) : null}
          </View>
          {note ? (
            <AppText variant="caption" tint={theme.accent} numberOfLines={2}>
              {note}
            </AppText>
          ) : null}
        </View>
        {trailing ??
          (onRemove ? (
            <IconButton
              name="heart"
              filled
              size={40}
              variant="plain"
              color={theme.heart}
              onPress={onRemove}
              accessibilityLabel={removeLabel}
            />
          ) : (
            <Icon name="chevron-right" size={18} color={theme.textTertiary} />
          ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two + 2,
    paddingRight: Spacing.three,
  },
  cover: {
    width: 68,
    height: 68,
    borderRadius: Radius.md,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
});
