import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MatchedIngredient } from '@/api/types';

/**
 * Ingredient rows for a recipe. "Have" is decided by the backend comparing the
 * recipe against the user's fridge, so the tick marks reflect real stored items.
 */
export function IngredientList({
  ingredients,
  state,
  onPressIngredient,
}: {
  ingredients: MatchedIngredient[];
  state: 'have' | 'missing' | 'optional';
  onPressIngredient?: (ingredient: MatchedIngredient) => void;
}) {
  const theme = useTheme();

  const marker =
    state === 'have'
      ? { icon: 'check-circle' as const, color: theme.success }
      : state === 'missing'
        ? { icon: 'cart' as const, color: theme.warning }
        : { icon: 'info' as const, color: theme.textTertiary };

  return (
    <View style={styles.list}>
      {ingredients.map((ingredient, index) => {
        const amount = [ingredient.quantity, ingredient.unit].filter(Boolean).join(' ').trim();
        const detail = [
          ingredient.note,
          state === 'have' && ingredient.matchedFridgeItem
            ? `in your fridge as ${ingredient.matchedFridgeItem.name}`
            : null,
        ]
          .filter(Boolean)
          .join(' · ');

        return (
          <View key={`${ingredient.name}-${index}`} style={styles.row}>
            <Icon name={marker.icon} size={17} color={marker.color} />
            <View style={styles.body}>
              <AppText variant="body">
                {amount ? `${amount} ` : ''}
                {ingredient.name}
              </AppText>
              {detail ? (
                <AppText variant="caption" color="textSecondary">
                  {detail}
                </AppText>
              ) : null}
            </View>
            {onPressIngredient ? (
              <AppText
                variant="caption"
                tint={theme.primary}
                onPress={() => onPressIngredient(ingredient)}
                suppressHighlighting>
                Swap
              </AppText>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two + 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two + 2,
  },
  body: {
    flex: 1,
    gap: 1,
  },
});
