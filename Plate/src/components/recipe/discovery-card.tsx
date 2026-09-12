import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { RecipeCover } from '@/components/recipe/recipe-cover';
import { IconButton } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Recipe } from '@/api/types';

/** The card in the discovery deck. Only shows facts the recipe actually carries. */
export function DiscoveryCard({
  recipe,
  saved,
  onToggleSave,
  showNutrition = true,
}: {
  recipe: Recipe;
  saved: boolean;
  onToggleSave?: () => void;
  showNutrition?: boolean;
}) {
  const theme = useTheme();
  const tags = [recipe.cuisine, ...recipe.dietaryTags].filter(Boolean).slice(0, 3);
  const coverage =
    typeof recipe.fridgeCoverage === 'number' ? Math.round(recipe.fridgeCoverage * 100) : null;

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <RecipeCover recipe={recipe} style={styles.cover}>
        <LinearGradient
          colors={['transparent', 'rgba(25,24,21,0.1)', 'rgba(25,24,21,0.62)']}
          locations={[0.42, 0.7, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {onToggleSave ? (
          <IconButton
            name="heart"
            filled={saved}
            onPress={onToggleSave}
            accessibilityLabel={saved ? 'Remove from saved' : 'Save recipe'}
            variant="plain"
            color={saved ? theme.heart : '#fff8ef'}
            style={styles.heart}
          />
        ) : null}
        <View style={styles.overlayFooter}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <AppText variant="caption" tint="#fff8ef" numberOfLines={1}>
                {tag}
              </AppText>
            </View>
          ))}
        </View>
      </RecipeCover>

      <View style={styles.body}>
        <AppText variant="title" numberOfLines={2}>
          {recipe.title}
        </AppText>
        {recipe.description ? (
          <AppText variant="small" color="textSecondary" numberOfLines={2}>
            {recipe.description}
          </AppText>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Icon name="clock" size={15} color={theme.textSecondary} />
            <AppText variant="small" color="textSecondary">
              {recipe.totalTime} min
            </AppText>
          </View>
          <View style={styles.metaItem}>
            <Icon name="flame" size={15} color={theme.textSecondary} />
            <AppText variant="small" color="textSecondary">
              {recipe.difficulty}
            </AppText>
          </View>
          <View style={styles.metaItem}>
            <Icon name="user" size={15} color={theme.textSecondary} />
            <AppText variant="small" color="textSecondary">
              {recipe.servings}
            </AppText>
          </View>
          {coverage !== null ? (
            <View style={styles.metaItem}>
              <Icon name="fridge" size={15} color={theme.accent} />
              <AppText variant="small" tint={theme.accent}>
                {coverage}% on hand
              </AppText>
            </View>
          ) : null}
        </View>

        {showNutrition && recipe.nutrition.calories !== null ? (
          <AppText variant="caption" color="textTertiary">
            {recipe.nutrition.calories} cal
            {recipe.nutrition.protein !== null ? ` · ${recipe.nutrition.protein}g protein` : ''}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#3a2a1c',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  cover: {
    flex: 1.6,
    minHeight: 0,
  },
  heart: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
    backgroundColor: 'rgba(25,24,21,0.5)',
  },
  overlayFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  tag: {
    backgroundColor: 'rgba(255,248,239,0.18)',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: 150,
  },
  body: {
    flexShrink: 0,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
});
