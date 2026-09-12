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
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { RecipeCard } from '@/components/home/food-card';
import type { Dish } from '@/components/home/dishes';

const THRESHOLD = 120;

export function SwipeDeck({
  dish,
  nextDish,
  liked,
  onToggleLike,
  onSkip,
  onOpenRecipe,
  expanded,
  topInset = 0,
  edgeToEdge = false,
}: {
  dish: Dish;
  nextDish?: Dish;
  liked: boolean;
  onToggleLike: () => void;
  onSkip: () => void;
  onOpenRecipe: () => void;
  expanded?: boolean;
  topInset?: number;
  edgeToEdge?: boolean;
}) {
  const { height, width } = useWindowDimensions();
  const x = useSharedValue(0);

  const heroHeight = Math.max(
    expanded ? height * 0.62 : height * 0.4,
    expanded ? 380 : 260,
  );

  const finishSkip = () => {
    onSkip();
    x.value = 0;
  };

  const finishOpen = () => {
    onOpenRecipe();
    x.value = 0;
  };

  const skip = () => {
    x.value = withTiming(-width * 1.15, { duration: 260 }, (finished) => {
      if (finished) runOnJS(finishSkip)();
    });
  };

  const open = () => {
    x.value = withTiming(width * 1.15, { duration: 260 }, (finished) => {
      if (finished) runOnJS(finishOpen)();
    });
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-18, 18])
    .failOffsetY([-12, 12])
    .onUpdate((event) => {
      x.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX < -THRESHOLD || event.velocityX < -800) {
        runOnJS(skip)();
      } else if (event.translationX > THRESHOLD || event.velocityX > 800) {
        runOnJS(open)();
      } else {
        x.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      {
        rotateZ: `${interpolate(x.value, [-220, 0, 220], [-10, 0, 10], Extrapolation.CLAMP)}deg`,
      },
    ],
  }));

  const stampSkip = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [-THRESHOLD, -36], [1, 0], Extrapolation.CLAMP),
  }));

  const stampOpen = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [36, THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  const underStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(Math.abs(x.value), [0, 160], [0.97, 1], Extrapolation.CLAMP),
      },
    ],
    opacity: interpolate(Math.abs(x.value), [0, 100], [0.5, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={[styles.wrap, { paddingTop: topInset }]}>
      <View style={styles.stack}>
        {nextDish ? (
          <Animated.View style={[styles.underCard, underStyle]} pointerEvents="none">
            <RecipeCard
              dish={nextDish}
              liked={false}
              onToggleLike={() => {}}
              expanded={expanded}
              heroHeight={heroHeight}
              edgeToEdge={edgeToEdge}
            />
          </Animated.View>
        ) : null}

        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.topCard, cardStyle]}>
            <RecipeCard
              dish={dish}
              liked={liked}
              onToggleLike={onToggleLike}
              expanded={expanded}
              heroHeight={heroHeight}
              edgeToEdge={edgeToEdge}
            />
            <Animated.View style={[styles.stamp, styles.stampSkip, stampSkip]} pointerEvents="none">
              <Text style={styles.stampSkipText}>SKIP</Text>
            </Animated.View>
            <Animated.View style={[styles.stamp, styles.stampOpen, stampOpen]} pointerEvents="none">
              <Text style={styles.stampOpenText}>OPEN</Text>
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  stack: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
  },
  underCard: {
    ...StyleSheet.absoluteFillObject,
  },
  topCard: {
    flex: 1,
  },
  stamp: {
    position: 'absolute',
    top: 28,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 3,
    borderRadius: 10,
  },
  stampSkip: {
    left: 18,
    borderColor: '#fff8ef',
    transform: [{ rotate: '-14deg' }],
  },
  stampOpen: {
    right: 18,
    borderColor: '#e85d3f',
    transform: [{ rotate: '14deg' }],
  },
  stampSkipText: {
    color: '#fff8ef',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  stampOpenText: {
    color: '#e85d3f',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
