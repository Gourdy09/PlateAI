import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutUp,
  LinearTransition,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { UtensilsCrossed } from '@/components/auth/icons';
import { DISHES } from '@/components/home/dishes';
import { DEFAULT_FILTERS, FilterPanel, type HomeFilters } from '@/components/home/filter-panel';
import { HomeIcon } from '@/components/home/home-icon';
import { TAB_BAR_CONTENT_HEIGHT } from '@/components/home/plate-tab-bar';
import { SwipeDeck } from '@/components/home/swipe-deck';
import { useAuth } from '@/ctx/auth';
import { Plate, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const layoutTransition = LinearTransition.duration(340).easing(Easing.out(Easing.cubic));

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
  const insets = useSafeAreaInsets();
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
  const nextDish = DISHES[(index + 1) % DISHES.length];
  const expanded = !filtersOpen;
  const tabBarSpace = TAB_BAR_CONTENT_HEIGHT + Math.max(insets.bottom, 8);

  function goNext() {
    setIndex((value) => (value + 1) % DISHES.length);
  }

  function openRecipe() {
    router.push({ pathname: '/(app)/recipe', params: { id: dish.id } });
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {!expanded ? (
        <>
          <View
            pointerEvents="none"
            style={[styles.herbWash, { backgroundColor: Plate.herbWash, opacity: 0.48 }]}
          />
          <View
            pointerEvents="none"
            style={[styles.spiceWash, { backgroundColor: Plate.spiceWash, opacity: 0.5 }]}
          />
        </>
      ) : null}

      <SafeAreaView style={styles.safe} edges={expanded ? [] : ['top']}>
        <Animated.View
          layout={layoutTransition}
          style={[
            styles.content,
            expanded && styles.contentExpanded,
            { paddingBottom: tabBarSpace },
            expanded && { paddingTop: insets.top },
          ]}>
          {filtersOpen ? (
            <Animated.View
              entering={FadeInDown.duration(280).easing(Easing.out(Easing.cubic))}
              exiting={FadeOutUp.duration(220).easing(Easing.in(Easing.cubic))}
              layout={layoutTransition}
              style={styles.topBlock}>
              <View style={styles.header}>
                <View style={styles.welcome}>
                  <View style={styles.eyebrow}>
                    <UtensilsCrossed size={15} color={theme.primary} />
                    <Text style={[styles.eyebrowText, { color: theme.primary }]}>TODAY'S TABLE</Text>
                  </View>
                  <Text style={[styles.title, { color: theme.text }]}>Welcome {name}</Text>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/(app)/onboarding',
                        params: { mode: 'ingredients' },
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Update my ingredients"
                    style={({ pressed }) => [
                      styles.ingredientsButton,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.inputBorder,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}>
                    <HomeIcon name="cart" width={16} height={16} color={theme.primary} />
                    <Text style={[styles.ingredientsButtonText, { color: theme.primary }]}>
                      Update my ingredients
                    </Text>
                  </Pressable>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Notifications"
                  style={[styles.bell, { backgroundColor: theme.card, shadowColor: '#6b3b20' }]}>
                  <HomeIcon name="bell" />
                </Pressable>
              </View>

              <FilterPanel
                open
                onToggle={() => setFiltersOpen(false)}
                value={filters}
                onChange={setFilters}
              />
            </Animated.View>
          ) : null}

          <Animated.View layout={layoutTransition} style={styles.deckArea}>
            {expanded ? (
              <Animated.View
                entering={FadeIn.duration(280)}
                exiting={FadeOut.duration(180)}
                style={[styles.floatingSlot, { top: insets.top + 8 }]}>
                <FilterPanel
                  open={false}
                  onToggle={() => setFiltersOpen(true)}
                  value={filters}
                  onChange={setFilters}
                />
              </Animated.View>
            ) : null}

            <SwipeDeck
              dish={dish}
              nextDish={nextDish}
              liked={!!liked[dish.id]}
              expanded={expanded}
              edgeToEdge={expanded}
              topInset={expanded ? insets.top + 62 : 0}
              onToggleLike={() =>
                setLiked((current) => ({ ...current, [dish.id]: !current[dish.id] }))
              }
              onSkip={goNext}
              onOpenRecipe={openRecipe}
            />
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  herbWash: {
    position: 'absolute',
    top: -40,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  spiceWash: {
    position: 'absolute',
    bottom: 120,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
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
    gap: Spacing.three,
    minHeight: 0,
  },
  contentExpanded: {
    maxWidth: '100%',
    paddingHorizontal: 0,
    gap: 0,
  },
  topBlock: {
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  welcome: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 30,
    lineHeight: 33,
    fontWeight: '400',
  },
  ingredientsButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  ingredientsButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  deckArea: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
  },
  floatingSlot: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 20,
  },
});
