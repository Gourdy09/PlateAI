import type { ReactNode } from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import type { Dish } from '@/components/home/dishes';
import { HomeIcon } from '@/components/home/home-icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function RecipeCard({
  dish,
  liked,
  onToggleLike,
  expanded,
  heroHeight,
  edgeToEdge = false,
}: {
  dish: Dish;
  liked: boolean;
  onToggleLike: () => void;
  expanded?: boolean;
  heroHeight: number;
  edgeToEdge?: boolean;
}) {
  const theme = useTheme();
  const cardColor = theme.card;

  return (
    <View
      style={[
        styles.card,
        edgeToEdge && styles.cardFlush,
        {
          backgroundColor: cardColor,
          shadowColor: '#6b3b20',
        },
      ]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
        nestedScrollEnabled>
        <View style={[styles.hero, { height: heroHeight }]}>
          <Image source={dish.image} style={styles.image} contentFit="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(25,24,21,0.28)', cardColor]}
            locations={[0.42, 0.72, 1]}
            style={styles.fade}
          />

          <Pressable
            onPress={onToggleLike}
            style={[styles.heart, { backgroundColor: 'rgba(255,253,249,0.92)' }]}
            accessibilityRole="button"
            accessibilityLabel="Save dish">
            <HomeIcon name="heart" filled={liked} color={theme.heart} />
          </Pressable>

          <View style={styles.heroMeta}>
            <View style={styles.tags}>
              {dish.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.name, { color: theme.text }]}>{dish.name}</Text>
            <Text style={[styles.summary, { color: theme.textSecondary }]}>{dish.summary}</Text>
          </View>
        </View>

        <View style={[styles.details, { backgroundColor: cardColor }, expanded && styles.detailsExpanded]}>
          <View style={styles.statRow}>
            <Stat label="Rating" value={`${dish.rating.toFixed(1)}★`} hint={`${dish.reviews} reviews`} />
            <Stat label="Cook time" value={`${dish.minutes} min`} hint={`${dish.servings} servings`} />
            <Stat label="Spice" value={dish.spice} hint={dish.difficulty} />
          </View>

          <Section title="Nutrition">
            <View style={styles.nutritionGrid}>
              <Nutrient label="Calories" value={`${dish.kcal}`} unit="kcal" />
              <Nutrient label="Protein" value={`${dish.protein}`} unit="g" />
              <Nutrient label="Carbs" value={`${dish.carbs}`} unit="g" />
              <Nutrient label="Fat" value={`${dish.fat}`} unit="g" />
              <Nutrient label="Fiber" value={`${dish.fiber}`} unit="g" />
              <Nutrient label="Sodium" value={`${dish.sodium}`} unit="mg" />
            </View>
          </Section>

          <Section title="Ingredients">
            <View style={styles.list}>
              {dish.ingredients.map((item) => (
                <View key={item} style={styles.listRow}>
                  <View style={[styles.bullet, { backgroundColor: theme.sage }]} />
                  <Text style={[styles.listText, { color: theme.text }]}>{item}</Text>
                </View>
              ))}
            </View>
          </Section>

          <Section title="Method">
            <View style={styles.list}>
              {dish.steps.map((step, index) => (
                <View key={step} style={styles.stepRow}>
                  <Text style={[styles.stepIndex, { color: theme.primary }]}>{index + 1}</Text>
                  <Text style={[styles.listText, { color: theme.text }]}>{step}</Text>
                </View>
              ))}
            </View>
          </Section>

          <View style={[styles.aiNote, { backgroundColor: theme.chip, borderColor: theme.inputBorder }]}>
            <Text style={[styles.aiTitle, { color: theme.text }]}>Coming soon</Text>
            <Text style={[styles.aiCopy, { color: theme.textSecondary }]}>
              Open a recipe fully to get AI substitutions tuned to your settings and Personalize Feed
              preferences.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title}</Text>
      {children}
    </View>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: theme.chip }]}>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statHint, { color: theme.textSecondary }]}>{hint}</Text>
    </View>
  );
}

function Nutrient({ label, value, unit }: { label: string; value: string; unit: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.nutrient, { borderColor: theme.inputBorder }]}>
      <Text style={[styles.nutrientValue, { color: theme.text }]}>
        {value}
        <Text style={[styles.nutrientUnit, { color: theme.textSecondary }]}> {unit}</Text>
      </Text>
      <Text style={[styles.nutrientLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 8,
  },
  cardFlush: {
    borderRadius: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  fade: {
    ...StyleSheet.absoluteFillObject,
  },
  heart: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMeta: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(37,34,30,0.45)',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    color: '#fff8ef',
    fontSize: 11,
    fontWeight: '600',
  },
  name: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '400',
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
  },
  details: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    gap: Spacing.four,
  },
  detailsExpanded: {
    paddingBottom: 36,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stat: {
    flex: 1,
    borderRadius: Radius.md,
    padding: 12,
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statHint: {
    fontSize: 11,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nutrient: {
    width: '31%',
    flexGrow: 1,
    minWidth: '30%',
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 2,
  },
  nutrientValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  nutrientUnit: {
    fontSize: 12,
    fontWeight: '500',
  },
  nutrientLabel: {
    fontSize: 11,
  },
  list: {
    gap: 10,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bullet: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 6,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  stepIndex: {
    width: 18,
    fontSize: 14,
    fontWeight: '800',
  },
  aiNote: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 14,
    gap: 6,
  },
  aiTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  aiCopy: {
    fontSize: 13,
    lineHeight: 18,
  },
});
