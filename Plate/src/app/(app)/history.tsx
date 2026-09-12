import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { RecipeListItem } from '@/components/recipe/recipe-list-item';
import { SegmentedControl } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSwipeHistory } from '@/api/use-recipes';
import type { SwipeDirection } from '@/api/types';

type Scope = 'all' | SwipeDirection;

export default function HistoryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [scope, setScope] = useState<Scope>('all');
  const history = useSwipeHistory(scope === 'all' ? undefined : scope);

  const entries = history.data ?? [];

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Everything you have seen"
        title="Swipe history"
        subtitle="What you passed on shapes what Plate suggests next."
        onBack
      />

      <View style={styles.filter}>
        <SegmentedControl
          options={[
            { value: 'all' as Scope, label: 'Everything' },
            { value: 'right' as Scope, label: 'Saved' },
            { value: 'left' as Scope, label: 'Passed' },
          ]}
          value={scope}
          onChange={setScope}
        />
      </View>

      {history.isPending ? (
        <LoadingState label="Loading your history…" />
      ) : history.isError ? (
        <ErrorState
          error={history.error}
          fallback="Your history could not load."
          onRetry={() => history.refetch()}
        />
      ) : entries.length === 0 ? (
        <EmptyState
          icon="clock"
          title="No swipes yet"
          description="Start swiping in Discover and everything you see shows up here."
          action={{ label: 'Go to Discover', onPress: () => router.push('/(app)/(tabs)') }}
        />
      ) : (
        <ScreenScroll
          onRefresh={() => history.refetch()}
          refreshing={history.isRefetching}
          contentStyle={styles.list}>
          {entries.map((entry) => (
            <RecipeListItem
              key={`${entry.recipe.id}-${entry.createdAt}`}
              recipe={entry.recipe}
              onPress={() =>
                router.push({ pathname: '/(app)/recipe/[id]', params: { id: entry.recipe.id } })
              }
              trailing={
                <View style={styles.direction}>
                  <Icon
                    name={entry.direction === 'right' ? 'heart' : 'close'}
                    size={16}
                    filled={entry.direction === 'right'}
                    color={entry.direction === 'right' ? theme.heart : theme.textTertiary}
                  />
                  <AppText variant="caption" color="textTertiary">
                    {entry.direction === 'right' ? 'Saved' : 'Passed'}
                  </AppText>
                </View>
              }
            />
          ))}
        </ScreenScroll>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filter: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  list: {
    gap: Spacing.two,
  },
  direction: {
    alignItems: 'center',
    gap: 2,
    width: 52,
  },
});
