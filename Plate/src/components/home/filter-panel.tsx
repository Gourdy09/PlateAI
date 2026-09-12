import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HomeIcon } from '@/components/home/home-icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const;
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
const GOALS = [
  'High protein',
  'Low carb',
  'Balanced',
  'Weight loss',
  'Plant-based',
  'Quick meals',
] as const;

export type HomeFilters = {
  meal: (typeof MEALS)[number];
  difficulty: (typeof DIFFICULTIES)[number];
  goal: (typeof GOALS)[number];
};

export const DEFAULT_FILTERS: HomeFilters = {
  meal: 'Lunch',
  difficulty: 'Easy',
  goal: 'High protein',
};

export function FilterPanel({
  open,
  onToggle,
  value,
  onChange,
}: {
  open: boolean;
  onToggle: () => void;
  value: HomeFilters;
  onChange: (next: HomeFilters) => void;
}) {
  const theme = useTheme();

  if (!open) {
    return (
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel="Expand personalize feed"
        style={[
          styles.floatingBar,
          {
            backgroundColor: theme.card,
            shadowColor: '#6b3b20',
          },
        ]}>
        <View style={styles.headerLeft}>
          <HomeIcon name="sliders" />
          <View style={styles.floatingCopy}>
            <Text style={[styles.title, { color: theme.text }]}>Personalize Feed</Text>
            <Text style={[styles.floatingMeta, { color: theme.textSecondary }]} numberOfLines={1}>
              {value.meal} · {value.difficulty} · {value.goal}
            </Text>
          </View>
        </View>
        <View style={styles.hideRow}>
          <Text style={[styles.hide, { color: theme.primary }]}>Expand</Text>
          <View style={{ transform: [{ rotate: '-90deg' }] }}>
            <HomeIcon name="chevron_down" />
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: theme.card,
          shadowColor: '#6b3b20',
        },
      ]}>
      <Pressable onPress={onToggle} style={styles.header} accessibilityRole="button">
        <View style={styles.headerLeft}>
          <HomeIcon name="sliders" />
          <Text style={[styles.title, { color: theme.text }]}>Personalize Feed</Text>
        </View>
        <View style={styles.hideRow}>
          <Text style={[styles.hide, { color: theme.textSecondary }]}>Collapse</Text>
          <HomeIcon name="chevron_down" />
        </View>
      </Pressable>

      <View style={styles.body}>
        <View style={styles.chipWrap}>
          {MEALS.map((meal) => (
            <Chip
              key={meal}
              label={meal}
              selected={value.meal === meal}
              onPress={() => onChange({ ...value, meal })}
            />
          ))}
        </View>

        <View style={styles.sectionBlock}>
          <Text style={[styles.section, { color: theme.textSecondary }]}>Difficulty</Text>
          <View style={styles.chipWrap}>
            {DIFFICULTIES.map((difficulty) => (
              <Chip
                key={difficulty}
                label={difficulty}
                selected={value.difficulty === difficulty}
                onPress={() => onChange({ ...value, difficulty })}
              />
            ))}
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={[styles.section, { color: theme.textSecondary }]}>Goal</Text>
          <View style={styles.chipWrap}>
            {GOALS.map((goal) => (
              <Chip
                key={goal}
                label={goal}
                selected={value.goal === goal}
                onPress={() => onChange({ ...value, goal })}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.sage : theme.chip,
          borderColor: selected ? theme.sage : theme.inputBorder,
        },
      ]}>
      <Text
        style={[
          styles.chipLabel,
          {
            color: selected ? '#ffffff' : theme.chipText,
            fontWeight: selected ? '600' : '500',
          },
        ]}
        numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: Radius.lg,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: Spacing.three,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.09,
    shadowRadius: 40,
    elevation: 4,
    overflow: 'hidden',
  },
  floatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
  floatingCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  floatingMeta: {
    fontSize: 11,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  title: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  hideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  hide: {
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    gap: Spacing.three,
  },
  sectionBlock: {
    gap: 8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  section: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  chip: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxWidth: '100%',
  },
  chipLabel: {
    fontSize: 13,
  },
});
