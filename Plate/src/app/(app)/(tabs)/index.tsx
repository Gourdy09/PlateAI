import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { FilterSheet, describeFilters } from '@/components/recipe/filter-sheet';
import { SwipeActions, SwipeHint } from '@/components/recipe/swipe-actions';
import { SwipeDeck, type SwipeDeckHandle } from '@/components/recipe/swipe-deck';
import { IconButton } from '@/components/ui/button';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState, Notice } from '@/components/ui/states';
import { Chip, ChipScroller } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { TAB_BAR_CONTENT_HEIGHT } from '@/components/nav/tab-bar';
import { Spacing } from '@/constants/theme';
import { useToast } from '@/ctx/toast';
import { firstName, greetingFor } from '@/lib/format';
import { useHaptics } from '@/lib/haptics';
import { useBootstrap, useSettings } from '@/api/use-account';
import {
  useDiscovery,
  useSavedRecipes,
  useSwipe,
  useToggleSaved,
  useUndoSwipe,
} from '@/api/use-recipes';
import type { DiscoveryFilters, Recipe, SwipeDirection } from '@/api/types';

const NO_RECIPES: Recipe[] = [];

export default function DiscoverScreen() {
  const router = useRouter();
  const toast = useToast();
  const haptics = useHaptics();

  const [filters, setFilters] = useState<DiscoveryFilters>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  /** Recipes already swiped in this session, so the deck can drop them locally. */
  const [swiped, setSwiped] = useState<string[]>([]);
  /** Cards put back by undo, shown ahead of the server feed. */
  const [restored, setRestored] = useState<Recipe[]>([]);
  const deck = useRef<SwipeDeckHandle>(null);

  const bootstrap = useBootstrap();
  const settings = useSettings();
  const discovery = useDiscovery(filters);
  const saved = useSavedRecipes();
  const swipe = useSwipe();
  const undo = useUndoSwipe();
  const toggleSaved = useToggleSaved();

  const savedIds = useMemo(
    () => new Set((saved.data ?? NO_RECIPES).map((recipe) => recipe.id)),
    [saved.data]
  );

  // The queue is derived from the server feed, so there is no second copy of it
  // in state that could drift from what the backend actually returned.
  const feed = discovery.data?.recipes ?? NO_RECIPES;
  const queue = useMemo(() => {
    const dismissed = new Set(swiped);
    const restoredIds = new Set(restored.map((recipe) => recipe.id));
    return [
      ...restored,
      ...feed.filter((recipe) => !dismissed.has(recipe.id) && !restoredIds.has(recipe.id)),
    ];
  }, [feed, restored, swiped]);

  const commitSwipe = async (recipe: Recipe, direction: SwipeDirection) => {
    try {
      await swipe.mutateAsync({ recipeId: recipe.id, direction });
      haptics.tap();
      setRestored((current) => current.filter((item) => item.id !== recipe.id));
      setSwiped((current) => [...current, recipe.id]);
      return true;
    } catch (error) {
      toast.showError(error, 'That swipe could not be saved. Try again.');
      return false;
    }
  };

  const handleUndo = async () => {
    try {
      const result = await undo.mutateAsync();
      if (!result.undone || !result.recipe) {
        toast.show('There is nothing left to undo.');
        return;
      }
      const recipe = result.recipe;
      setSwiped((current) => current.filter((id) => id !== recipe.id));
      setRestored((current) =>
        current.some((item) => item.id === recipe.id) ? current : [recipe, ...current]
      );
    } catch (error) {
      toast.showError(error, 'That swipe could not be undone.');
    }
  };

  const openRecipe = (recipe: Recipe) =>
    router.push({ pathname: '/(app)/recipe/[id]', params: { id: recipe.id } });

  const handleToggleSave = async (recipe: Recipe) => {
    try {
      await toggleSaved.mutateAsync({ recipeId: recipe.id, saved: savedIds.has(recipe.id) });
    } catch (error) {
      toast.showError(error, 'That recipe could not be updated.');
    }
  };

  const activeFilters = describeFilters(filters);
  const name = firstName(bootstrap.data?.user.name, bootstrap.data?.user.email);
  const aiAvailable = bootstrap.data?.capabilities.ai ?? true;
  const session = bootstrap.data?.activeCookingSession;
  const canUndo = swiped.length > 0 || (bootstrap.data?.stats.swipes ?? 0) > 0;

  return (
    <Screen>
      <ScreenHeader
        eyebrow={`${greetingFor()}, ${name}`}
        title="What sounds good?"
        right={
          <>
            <IconButton
              name="fridge"
              onPress={() => router.push('/(app)/fridge')}
              accessibilityLabel="Open my fridge"
              size={40}
            />
            <IconButton
              name="sliders"
              onPress={() => setFiltersOpen(true)}
              accessibilityLabel="Filter recipes"
              size={40}
            />
          </>
        }
      />

      <View style={styles.chipRow}>
        <ChipScroller>
          <Chip label="Ask Plate" icon="mic" onPress={() => router.push('/(app)/chat')} tone="accent" />
          <Chip
            label="Cook from my fridge"
            icon="fridge"
            onPress={() => router.push('/(app)/generate')}
          />
          {activeFilters.length > 0 ? (
            activeFilters.map((label) => (
              <Chip key={label} label={label} selected onPress={() => setFiltersOpen(true)} />
            ))
          ) : (
            <Chip label="All recipes" onPress={() => setFiltersOpen(true)} />
          )}
        </ChipScroller>
      </View>

      {session ? (
        <View style={styles.banner}>
          <Notice
            tone="info"
            icon="utensils"
            title={session.recipeTitle ?? 'Cooking in progress'}
            message={`You are on step ${session.currentStep + 1}${
              session.totalSteps ? ` of ${session.totalSteps}` : ''
            }.`}
            action={{
              label: 'Resume cooking',
              onPress: () =>
                router.push({
                  pathname: '/(app)/cook/[sessionId]',
                  params: { sessionId: session.id },
                }),
            }}
          />
        </View>
      ) : null}

      <View style={styles.deckArea}>
        {discovery.isPending ? (
          <LoadingState label="Plate is putting together tonight's ideas…" />
        ) : discovery.isError ? (
          <ErrorState
            error={discovery.error}
            fallback="The feed could not load."
            onRetry={() => discovery.refetch()}
          />
        ) : !aiAvailable && queue.length === 0 ? (
          <EmptyState
            icon="info"
            title="Recipe generation is not configured"
            description="This Plate backend has no Gemini API key set, so new recipes cannot be generated. Saved recipes and your fridge still work."
            action={{
              label: 'Open saved recipes',
              onPress: () => router.push('/(app)/(tabs)/saved'),
            }}
          />
        ) : queue.length === 0 ? (
          <EmptyState
            icon="refresh"
            title="That is everything for now"
            description="Plate has shown you every match for these filters. Widen them or ask for something specific."
            action={{ label: 'Get more ideas', icon: 'refresh', onPress: () => discovery.refetch() }}
            secondaryAction={{ label: 'Change filters', onPress: () => setFiltersOpen(true) }}
          />
        ) : (
          <SwipeDeck
            ref={deck}
            recipes={queue}
            savedIds={savedIds}
            onSwipe={commitSwipe}
            onOpen={openRecipe}
            onToggleSave={handleToggleSave}
            showNutrition={settings.data?.showNutritionOnCards ?? true}
            reduceMotion={settings.data?.reduceMotion ?? false}
            locked={swipe.isPending}
          />
        )}
      </View>

      {queue.length > 0 && !discovery.isPending ? (
        <View style={styles.actions}>
          <SwipeActions
            onPass={() => deck.current?.swipe('left')}
            onSave={() => deck.current?.swipe('right')}
            onUndo={handleUndo}
            onOpen={() => queue[0] && openRecipe(queue[0])}
            disabled={swipe.isPending}
            canUndo={canUndo}
            undoing={undo.isPending}
          />
          <SwipeHint />
        </View>
      ) : null}

      {discovery.isFetching && queue.length > 0 ? (
        <AppText variant="caption" color="textTertiary" align="center" style={styles.refreshing}>
          Loading more ideas…
        </AppText>
      ) : null}

      {filtersOpen ? (
        <FilterSheet
          onClose={() => setFiltersOpen(false)}
          value={filters}
          onApply={(next) => {
            setFilters(next);
            setRestored([]);
          }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    paddingBottom: Spacing.three,
  },
  banner: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  deckArea: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
  },
  actions: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: TAB_BAR_CONTENT_HEIGHT + Spacing.four,
    gap: Spacing.two,
  },
  refreshing: {
    position: 'absolute',
    bottom: TAB_BAR_CONTENT_HEIGHT + Spacing.two,
    left: 0,
    right: 0,
  },
});
