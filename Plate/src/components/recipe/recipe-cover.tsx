import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Fill, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Recipe } from '@/api/types';

/**
 * Recipe imagery. Gemini writes recipes, it does not photograph them, so a photo
 * only appears when the backend found a real one for this dish. Otherwise Plate
 * draws a typographic cover rather than showing a stock photo of another meal.
 */
export function RecipeCover({
  recipe,
  style,
  compact = false,
  children,
}: {
  recipe: Pick<Recipe, 'title' | 'image' | 'cuisine'>;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  const hasPhoto = typeof recipe.image === 'string' && /^https?:\/\//.test(recipe.image);

  if (hasPhoto) {
    return (
      <View style={[styles.wrap, style]}>
        <Image
          source={{ uri: recipe.image }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={220}
          accessibilityLabel={recipe.title}
        />
        {children}
      </View>
    );
  }

  // Two washes keyed off the title keep covers distinguishable without random colour.
  const seed = [...recipe.title].reduce((total, character) => total + character.charCodeAt(0), 0);
  const background = seed % 2 === 0 ? theme.accentWash : theme.primaryWash;
  const accent = seed % 2 === 0 ? theme.accent : theme.primary;

  return (
    <View style={[styles.wrap, { backgroundColor: background }, style]}>
      <View style={[styles.fallback, compact ? styles.fallbackCompact : null]}>
        <Icon name="utensils" size={compact ? 22 : 34} color={accent} />
        {compact ? null : (
          <>
            <AppText variant="heading" tint={accent} align="center" numberOfLines={3}>
              {recipe.title}
            </AppText>
            {recipe.cuisine ? (
              <AppText variant="eyebrow" tint={accent} uppercase>
                {recipe.cuisine}
              </AppText>
            ) : null}
          </>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fallback: {
    ...Fill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  fallbackCompact: {
    padding: Spacing.two,
  },
});
