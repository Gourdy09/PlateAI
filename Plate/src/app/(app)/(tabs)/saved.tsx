import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { RecipeListItem } from '@/components/recipe/recipe-list-item';
import { TAB_BAR_CONTENT_HEIGHT } from '@/components/nav/tab-bar';
import { IconButton } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { Chip, ChipScroller } from '@/components/ui/surface';
import { Spacing } from '@/constants/theme';
import { useToast } from '@/ctx/toast';
import { useSavedRecipes, useToggleSaved } from '@/api/use-recipes';
import type { Recipe } from '@/api/types';

const NO_RECIPES: Recipe[] = [];

export default function SavedScreen() {
  const router = useRouter();
  const toast = useToast();
  const saved = useSavedRecipes();
  const toggleSaved = useToggleSaved();

  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState<string | null>(null);

  const recipes = saved.data ?? NO_RECIPES;

  const cuisines = useMemo(() => {
    const unique = new Set(recipes.map((recipe) => recipe.cuisine).filter(Boolean));
    return [...unique].sort();
  }, [recipes]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return recipes.filter((recipe) => {
      if (cuisine && recipe.cuisine !== cuisine) return false;
      if (!term) return true;
      return (
        recipe.title.toLowerCase().includes(term) ||
        recipe.ingredients.some((ingredient) => ingredient.name.toLowerCase().includes(term))
      );
    });
  }, [cuisine, recipes, search]);

  const remove = async (recipeId: string) => {
    try {
      await toggleSaved.mutateAsync({ recipeId, saved: true });
    } catch (error) {
      toast.showError(error, 'That recipe could not be removed.');
    }
  };

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Your collection"
        title="Saved recipes"
        subtitle={
          recipes.length
            ? `${recipes.length} recipe${recipes.length === 1 ? '' : 's'} you swiped right on`
            : undefined
        }
        right={
          <IconButton
            name="clock"
            onPress={() => router.push('/(app)/history')}
            accessibilityLabel="View swipe history"
            size={40}
          />
        }
      />

      {saved.isPending ? (
        <LoadingState label="Loading your saved recipes…" />
      ) : saved.isError ? (
        <ErrorState
          error={saved.error}
          fallback="Your saved recipes could not load."
          onRetry={() => saved.refetch()}
        />
      ) : recipes.length === 0 ? (
        <EmptyState
          icon="heart"
          title="Nothing saved yet"
          description="Swipe right on a recipe in Discover and it lands here, with the full method and your ingredient match."
          action={{ label: 'Find recipes', onPress: () => router.push('/(app)/(tabs)') }}
        />
      ) : (
        <>
          <View style={styles.controls}>
            <TextField
              placeholder="Search saved recipes or ingredients"
              icon="search"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>

          {cuisines.length > 1 ? (
            <View style={styles.chipRow}>
              <ChipScroller>
                <Chip label="All" selected={cuisine === null} onPress={() => setCuisine(null)} />
                {cuisines.map((item) => (
                  <Chip
                    key={item}
                    label={item}
                    selected={cuisine === item}
                    onPress={() => setCuisine(cuisine === item ? null : item)}
                  />
                ))}
              </ChipScroller>
            </View>
          ) : null}

          <ScreenScroll
            onRefresh={() => saved.refetch()}
            refreshing={saved.isRefetching}
            bottomInset={TAB_BAR_CONTENT_HEIGHT + Spacing.five}
            contentStyle={styles.list}>
            {visible.length === 0 ? (
              <EmptyState
                icon="search"
                title="No matches"
                description="Nothing in your collection matches that search yet."
              />
            ) : (
              visible.map((recipe) => (
                <RecipeListItem
                  key={recipe.id}
                  recipe={recipe}
                  onPress={() =>
                    router.push({ pathname: '/(app)/recipe/[id]', params: { id: recipe.id } })
                  }
                  onRemove={() => remove(recipe.id)}
                />
              ))
            )}
          </ScreenScroll>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  controls: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  chipRow: {
    paddingBottom: Spacing.three,
  },
  list: {
    gap: Spacing.two,
  },
});
