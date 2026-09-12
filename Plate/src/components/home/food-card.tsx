import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Dish } from '@/components/home/dishes';
import { HomeIcon } from '@/components/home/home-icon';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

export function FoodCard({
  dish,
  liked,
  onToggleLike,
}: {
  dish: Dish;
  liked: boolean;
  onToggleLike: () => void;
}) {
  const theme = useTheme();
  const scheme = useColorScheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.filterBorder }]}>
      <View style={styles.photo}>
        <Image source={dish.image} style={styles.image} contentFit="cover" />
        <View style={styles.photoShade} />
        <Pressable
          onPress={onToggleLike}
          style={[styles.heart, { backgroundColor: scheme === 'dark' ? 'rgba(25,24,21,0.8)' : 'rgba(255,255,255,0.8)' }]}
          accessibilityRole="button"
          accessibilityLabel="Save dish">
          <HomeIcon name="heart" filled={liked} color={theme.heart} />
        </Pressable>
        <View style={styles.tags}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{dish.kcal} kcal</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{dish.protein}g Protein</Text>
          </View>
        </View>
      </View>
      <View style={styles.details}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {dish.name}
        </Text>
        <View style={styles.nutrition}>
          <Text style={[styles.nLabel, { color: theme.chipText }]}>
            Carbs: <Text style={[styles.nValue, { color: theme.text }]}>{dish.carbs}g</Text>
          </Text>
          <Text style={[styles.nLabel, { color: theme.chipText }]}>
            Fat: <Text style={[styles.nValue, { color: theme.text }]}>{dish.fat}g</Text>
          </Text>
          <Text style={[styles.nLabel, { color: theme.chipText }]}>
            Time: <Text style={[styles.nValue, { color: theme.sage }]}>{dish.minutes} min</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 330,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
    shadowColor: '#2b2620',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  photo: {
    height: 210,
    width: '100%',
    justifyContent: 'flex-end',
    padding: 16,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: 210,
  },
  photoShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  heart: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  details: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
  },
  nutrition: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  nLabel: {
    fontSize: 13,
  },
  nValue: {
    fontWeight: '600',
  },
});
