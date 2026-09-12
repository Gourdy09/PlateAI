import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DISHES } from '@/components/home/dishes';
import { DEFAULT_FILTERS, FilterPanel, type HomeFilters } from '@/components/home/filter-panel';
import { HomeIcon } from '@/components/home/home-icon';
import { SwipeDeck } from '@/components/home/swipe-deck';
import { useAuth } from '@/ctx/auth';
import { Plate } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function welcomeName(name?: string | null, email?: string | null) {
  const fromName = name?.trim();
  if (fromName) {
    return fromName
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  if (!email) return 'Chef';
  const local = email.split('@')[0]?.replace(/[._-]+/g, ' ').trim() || 'Chef';
  return local
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function HomeScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const name = useMemo(
    () => welcomeName(session?.user.name, session?.user.email),
    [session],
  );
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [filters, setFilters] = useState<HomeFilters>(DEFAULT_FILTERS);
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  const dish = DISHES[index % DISHES.length];

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.herb, { backgroundColor: Plate.herbWash }]} />
      <View style={[styles.spice, { backgroundColor: Plate.spiceWash }]} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.welcome}>
              <Text style={[styles.title, { color: theme.text }]}>Welcome {name}</Text>
              <Text style={[styles.sub, { color: theme.chipText }]}>
                Let's find your perfect bite today.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              style={[styles.bell, { backgroundColor: theme.input, borderColor: theme.filterBorder }]}>
              <HomeIcon name="bell" />
            </Pressable>
          </View>

          <FilterPanel
            open={filtersOpen}
            onToggle={() => setFiltersOpen((value) => !value)}
            value={filters}
            onChange={setFilters}
          />

          <SwipeDeck
            dish={dish}
            liked={!!liked[dish.id]}
            onToggleLike={() =>
              setLiked((current) => ({ ...current, [dish.id]: !current[dish.id] }))
            }
            onNext={() => setIndex((value) => (value + 1) % DISHES.length)}
            onOpenRecipe={() => router.push({ pathname: '/(app)/recipe', params: { id: dish.id } })}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  herb: {
    position: 'absolute',
    top: 60,
    right: -34,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.48,
  },
  spice: {
    position: 'absolute',
    bottom: 160,
    left: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
    opacity: 0.5,
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 140,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcome: {
    flex: 1,
    gap: 2,
    paddingRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  sub: {
    fontSize: 13,
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
