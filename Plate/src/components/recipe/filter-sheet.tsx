import { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { Button } from '@/components/ui/button';
import { Stepper } from '@/components/ui/field';
import { Sheet } from '@/components/ui/sheet';
import { Chip, ChipWrap, Section } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useMetaOptions } from '@/api/use-account';
import type { Difficulty, DiscoveryFilters, MealType } from '@/api/types';

const TIME_CHOICES = [15, 30, 45, 60, 90];

/**
 * Filters for the discovery feed. Values come from the server's option list so
 * the app can never ask for something the backend does not accept. The caller
 * mounts this only while it is open, so the draft always starts from the applied
 * filters.
 */
export function FilterSheet({
  onClose,
  value,
  onApply,
}: {
  onClose: () => void;
  value: DiscoveryFilters;
  onApply: (next: DiscoveryFilters) => void;
}) {
  const { data: meta } = useMetaOptions();
  const [draft, setDraft] = useState<DiscoveryFilters>(value);

  const toggle = <K extends keyof DiscoveryFilters>(key: K, next: DiscoveryFilters[K]) =>
    setDraft((current) => ({ ...current, [key]: current[key] === next ? undefined : next }));

  return (
    <Sheet
      visible
      onClose={onClose}
      title="Refine the feed"
      subtitle="Your allergies and diets always apply, filters or not."
      footer={
        <>
          <Button
            label="Show recipes"
            onPress={() => {
              onApply(draft);
              onClose();
            }}
          />
          <Button label="Clear filters" variant="ghost" onPress={() => setDraft({})} />
        </>
      }>
      <Section title="Meal">
        <ChipWrap>
          {(meta?.mealTypes ?? []).map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={draft.mealType === option.value}
              onPress={() => toggle('mealType', option.value as MealType)}
            />
          ))}
        </ChipWrap>
      </Section>

      <Section title="Effort">
        <ChipWrap>
          {(meta?.difficulties ?? []).map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={draft.difficulty === option.value}
              onPress={() => toggle('difficulty', option.value as Difficulty)}
            />
          ))}
        </ChipWrap>
      </Section>

      <Section title="Time">
        <ChipWrap>
          {TIME_CHOICES.map((minutes) => (
            <Chip
              key={minutes}
              label={`Under ${minutes} min`}
              selected={draft.maxTime === minutes}
              onPress={() => toggle('maxTime', minutes)}
            />
          ))}
        </ChipWrap>
      </Section>

      <Section title="Cuisine">
        <ChipWrap>
          {(meta?.cuisines ?? []).map((cuisine) => (
            <Chip
              key={cuisine}
              label={cuisine}
              selected={draft.cuisine === cuisine}
              onPress={() => toggle('cuisine', cuisine)}
            />
          ))}
        </ChipWrap>
        {!meta ? (
          <AppText variant="caption" color="textTertiary">
            Loading options…
          </AppText>
        ) : null}
      </Section>

      <View style={styles.servings}>
        <Stepper
          label="Servings"
          value={draft.servings ?? 2}
          min={1}
          max={12}
          onChange={(next) => setDraft((current) => ({ ...current, servings: next }))}
        />
      </View>
    </Sheet>
  );
}

/** Summarises the active filters for the row under the header. */
export function describeFilters(filters: DiscoveryFilters) {
  const parts = [
    filters.mealType,
    filters.difficulty,
    filters.cuisine,
    filters.maxTime ? `under ${filters.maxTime} min` : undefined,
    filters.servings ? `${filters.servings} servings` : undefined,
  ].filter(Boolean) as string[];
  return parts;
}

const styles = StyleSheet.create({
  servings: {
    paddingTop: Spacing.two,
  },
});
