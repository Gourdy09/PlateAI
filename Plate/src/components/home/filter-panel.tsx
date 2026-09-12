import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { HomeIcon } from '@/components/home/home-icon';
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

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: theme.card,
          borderColor: theme.filterBorder,
        },
      ]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <HomeIcon name="sliders" />
          <Text style={[styles.title, { color: theme.text }]}>Personalize Feed</Text>
        </View>
        <Pressable onPress={onToggle} hitSlop={8} style={styles.hideRow} accessibilityRole="button">
          <Text style={[styles.hide, { color: theme.chipText }]}>{open ? 'Hide' : 'Show'}</Text>
          <View style={{ transform: [{ rotate: open ? '0deg' : '-90deg' }] }}>
            <HomeIcon name="chevron_down" />
          </View>
        </Pressable>
      </View>

      {open ? (
        <View style={styles.body}>
          <View style={styles.rowWrap}>
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
            <Text style={[styles.section, { color: theme.chipText }]}>Difficulty</Text>
            <View style={styles.row}>
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
            <Text style={[styles.section, { color: theme.chipText }]}>Goal</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {GOALS.map((goal) => (
                <Chip
                  key={goal}
                  label={goal}
                  selected={value.goal === goal}
                  onPress={() => onChange({ ...value, goal })}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      ) : null}
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
        { backgroundColor: selected ? theme.sage : theme.chip },
      ]}>
      <Text
        style={[
          styles.chipLabel,
          {
            color: selected ? '#ffffff' : theme.chipText,
            fontWeight: selected ? '600' : '400',
          },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  hideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hide: {
    fontSize: 12,
  },
  body: {
    gap: 16,
  },
  sectionBlock: {
    gap: 8,
  },
  rowWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  section: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  chip: {
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipLabel: {
    fontSize: 13,
  },
});
