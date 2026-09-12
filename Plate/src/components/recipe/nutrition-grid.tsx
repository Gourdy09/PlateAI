import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Nutrition } from '@/api/types';

const FIELDS: { key: keyof Nutrition; label: string; unit: string }[] = [
  { key: 'calories', label: 'Calories', unit: '' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
  { key: 'fiber', label: 'Fiber', unit: 'g' },
  { key: 'sodium', label: 'Sodium', unit: 'mg' },
];

/**
 * Nutrition per serving. Values Gemini did not provide are left out rather than
 * filled in with a guess, and the estimate is labelled as one.
 */
export function NutritionGrid({ nutrition }: { nutrition: Nutrition }) {
  const theme = useTheme();
  const available = FIELDS.filter((field) => nutrition[field.key] !== null);

  if (available.length === 0) {
    return (
      <AppText variant="small" color="textSecondary">
        No nutrition estimate is available for this recipe.
      </AppText>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {available.map((field) => (
          <View
            key={field.key}
            style={[styles.cell, { backgroundColor: theme.surfaceSunken, borderColor: theme.border }]}>
            <AppText variant="bodyStrong">
              {nutrition[field.key]}
              {field.unit}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              {field.label}
            </AppText>
          </View>
        ))}
      </View>
      <AppText variant="caption" color="textTertiary">
        Estimated per serving. Treat it as a guide, not a measurement.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  cell: {
    flexGrow: 1,
    flexBasis: '30%',
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
