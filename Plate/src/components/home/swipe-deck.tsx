import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet, Text, View } from 'react-native';

import { FoodCard } from '@/components/home/food-card';
import { HomeIcon } from '@/components/home/home-icon';
import type { Dish } from '@/components/home/dishes';
import { useTheme } from '@/hooks/use-theme';

const THRESHOLD = 90;

export function SwipeDeck({
  dish,
  liked,
  onToggleLike,
  onNext,
  onOpenRecipe,
}: {
  dish: Dish;
  liked: boolean;
  onToggleLike: () => void;
  onNext: () => void;
  onOpenRecipe: () => void;
}) {
  const theme = useTheme();
  const x = useSharedValue(0);

  const finish = (direction: 'left' | 'right') => {
    x.value = withSpring(0, { damping: 18, stiffness: 180 });
    if (direction === 'left') onNext();
    else onOpenRecipe();
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .onUpdate((event) => {
      x.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX < -THRESHOLD) {
        runOnJS(finish)('left');
      } else if (event.translationX > THRESHOLD) {
        runOnJS(finish)('right');
      } else {
        x.value = withSpring(0, { damping: 18, stiffness: 180 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { rotateZ: `${interpolate(x.value, [-200, 0, 200], [-8, 0, 8])}deg` },
    ],
  }));

  return (
    <View style={styles.wrap}>
      <GestureDetector gesture={pan}>
        <Animated.View style={cardStyle}>
          <FoodCard dish={dish} liked={liked} onToggleLike={onToggleLike} />
        </Animated.View>
      </GestureDetector>
      <View style={styles.hints}>
        <View style={styles.hint}>
          <HomeIcon name="arrow_left" />
          <Text style={[styles.hintMuted, { color: theme.chipText }]}>Next dish</Text>
        </View>
        <View style={styles.hint}>
          <Text style={[styles.hintAccent, { color: theme.recipeAccent }]}>View recipe</Text>
          <HomeIcon name="arrow_right" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    width: '100%',
  },
  hints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintMuted: {
    fontSize: 12,
    fontWeight: '500',
  },
  hintAccent: {
    fontSize: 12,
    fontWeight: '600',
  },
});
