import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getDish } from '@/components/home/dishes';
import { HomeIcon } from '@/components/home/home-icon';
import { useTheme } from '@/hooks/use-theme';

export default function RecipeScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const dish = getDish(id ?? 'quinoa');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button">
        <HomeIcon name="arrow_left" />
        <Text style={{ color: theme.primary, fontWeight: '600' }}>Back</Text>
      </Pressable>
      <Image source={dish.image} style={styles.hero} contentFit="cover" />
      <View style={styles.body}>
        <Text style={[styles.title, { color: theme.text }]}>{dish.name}</Text>
        <Text style={[styles.meta, { color: theme.chipText }]}>
          {dish.kcal} kcal · {dish.protein}g protein · {dish.minutes} min
        </Text>
        <Text style={[styles.copy, { color: theme.chipText }]}>
          Swipe right saved this plate. Full cook steps will live here once recipes are wired up.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  hero: {
    width: '100%',
    height: 280,
  },
  body: {
    padding: 24,
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  meta: {
    fontSize: 14,
    fontWeight: '600',
  },
  copy: {
    fontSize: 15,
    lineHeight: 22,
  },
});
