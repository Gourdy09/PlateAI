import { useCallback, useEffect, useImperativeHandle } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { DiscoveryCard } from '@/components/recipe/discovery-card';
import { AppText } from '@/components/ui/text';
import { Fill, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Recipe, SwipeDirection } from '@/api/types';

const THRESHOLD = 110;
const FLING_DURATION = 220;

export type SwipeDeckHandle = { swipe: (direction: SwipeDirection) => void };

/**
 * The discovery deck. A card only leaves the deck once the backend has stored the
 * swipe: `onSwipe` resolving false springs the card back, so a failed write never
 * looks like a successful one.
 */
export function SwipeDeck({
  ref,
  recipes,
  savedIds,
  onSwipe,
  onOpen,
  onToggleSave,
  showNutrition = true,
  reduceMotion = false,
  locked = false,
}: {
  ref?: React.Ref<SwipeDeckHandle>;
  recipes: Recipe[];
  savedIds: Set<string>;
  onSwipe: (recipe: Recipe, direction: SwipeDirection) => Promise<boolean>;
  onOpen: (recipe: Recipe) => void;
  onToggleSave: (recipe: Recipe) => void;
  showNutrition?: boolean;
  reduceMotion?: boolean;
  /** Set while a swipe is being written, to block a second one. */
  locked?: boolean;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const x = useSharedValue(0);

  const [top, next, peek] = recipes;
  const topId = top?.id;

  // A new card, including one restored by undo, always starts centred.
  useEffect(() => {
    x.set(0);
  }, [topId, x]);

  const commit = useCallback(
    async (recipe: Recipe, direction: SwipeDirection) => {
      const committed = await onSwipe(recipe, direction);
      // On success the parent drops the recipe, which recentres the deck above.
      if (!committed) x.set(withSpring(0, { damping: 20, stiffness: 210 }));
    },
    [onSwipe, x]
  );

  const fling = useCallback(
    (direction: SwipeDirection) => {
      if (!top || locked) return;
      const target = direction === 'right' ? width * 1.25 : -width * 1.25;
      if (reduceMotion) {
        x.set(target);
        commit(top, direction);
        return;
      }
      x.set(
        withTiming(target, { duration: FLING_DURATION }, (finished) => {
          if (finished) runOnJS(commit)(top, direction);
        })
      );
    },
    [commit, locked, reduceMotion, top, width, x]
  );

  useImperativeHandle(ref, () => ({ swipe: fling }), [fling]);

  const tap = Gesture.Tap().onEnd(() => {
    if (top) runOnJS(onOpen)(top);
  });

  const pan = Gesture.Pan()
    .enabled(!locked)
    .activeOffsetX([-16, 16])
    .failOffsetY([-20, 20])
    .onUpdate((event) => {
      x.set(event.translationX);
    })
    .onEnd((event) => {
      if (event.translationX < -THRESHOLD || event.velocityX < -850) {
        runOnJS(fling)('left');
      } else if (event.translationX > THRESHOLD || event.velocityX > 850) {
        runOnJS(fling)('right');
      } else {
        x.set(withSpring(0, { damping: 20, stiffness: 210 }));
      }
    });

  const gesture = Gesture.Exclusive(pan, tap);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() },
      { rotateZ: `${interpolate(x.get(), [-240, 0, 240], [-11, 0, 11], Extrapolation.CLAMP)}deg` },
    ],
  }));

  const passStamp = useAnimatedStyle(() => ({
    opacity: interpolate(x.get(), [-THRESHOLD, -28], [1, 0], Extrapolation.CLAMP),
  }));

  const saveStamp = useAnimatedStyle(() => ({
    opacity: interpolate(x.get(), [28, THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  const nextStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(Math.abs(x.get()), [0, 160], [0.96, 1], Extrapolation.CLAMP) },
    ],
    opacity: interpolate(Math.abs(x.get()), [0, 80], [0.72, 1], Extrapolation.CLAMP),
  }));

  if (!top) return null;

  return (
    <View style={styles.wrap}>
      {peek ? (
        <Animated.View style={[styles.under, styles.peek]} pointerEvents="none">
          <DiscoveryCard recipe={peek} saved={savedIds.has(peek.id)} showNutrition={showNutrition} />
        </Animated.View>
      ) : null}
      {next ? (
        <Animated.View style={[styles.under, nextStyle]} pointerEvents="none">
          <DiscoveryCard recipe={next} saved={savedIds.has(next.id)} showNutrition={showNutrition} />
        </Animated.View>
      ) : null}

      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.top, cardStyle]}>
          <DiscoveryCard
            recipe={top}
            saved={savedIds.has(top.id)}
            onToggleSave={() => onToggleSave(top)}
            showNutrition={showNutrition}
          />
          <Animated.View style={[styles.stamp, styles.passStamp, passStamp]} pointerEvents="none">
            <AppText variant="bodyStrong" tint="#fff8ef" style={styles.stampText}>
              PASS
            </AppText>
          </Animated.View>
          <Animated.View
            style={[styles.stamp, { borderColor: theme.primary }, styles.saveStamp, saveStamp]}
            pointerEvents="none">
            <AppText variant="bodyStrong" tint={theme.primary} style={styles.stampText}>
              SAVE
            </AppText>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 0,
  },
  under: {
    ...Fill,
  },
  peek: {
    transform: [{ scale: 0.92 }],
    opacity: 0.35,
  },
  top: {
    flex: 1,
  },
  stamp: {
    position: 'absolute',
    top: 26,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderWidth: 3,
    borderRadius: Radius.sm,
  },
  passStamp: {
    left: 18,
    borderColor: '#fff8ef',
    transform: [{ rotate: '-13deg' }],
  },
  saveStamp: {
    right: 18,
    transform: [{ rotate: '12deg' }],
  },
  stampText: {
    fontSize: 17,
    letterSpacing: 1,
  },
});
