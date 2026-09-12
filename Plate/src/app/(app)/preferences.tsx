import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { SegmentedControl, Stepper, TextField } from '@/components/ui/field';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/screen';
import { ErrorState, LoadingState, Notice } from '@/components/ui/states';
import { Card, Chip, ChipWrap, Section } from '@/components/ui/surface';
import { TagEditor } from '@/components/ui/tag-editor';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useToast } from '@/ctx/toast';
import {
  useMetaOptions,
  usePreferences,
  useUpdateAllergies,
  useUpdatePreferences,
} from '@/api/use-account';
import type {
  Budget,
  CookingSkill,
  Difficulty,
  MealType,
  NutritionFocus,
  Preferences,
  UnitSystem,
} from '@/api/types';

const TIME_CHOICES = [15, 30, 45, 60, 90, 120];

export default function PreferencesScreen() {
  const toast = useToast();
  const preferences = usePreferences();
  const meta = useMetaOptions();
  const update = useUpdatePreferences();
  const updateAllergies = useUpdateAllergies();

  const value = preferences.data;

  const patch = useCallback(
    (next: Partial<Preferences>) => {
      update.mutate(next, {
        onError: (error) => toast.showError(error, 'That change could not be saved.'),
      });
    },
    [toast, update]
  );

  const toggleInList = useCallback(
    (key: 'dietaryRestrictions' | 'favoriteCuisines' | 'preferredMealTypes', item: string) => {
      if (!value) return;
      const current = value[key] as string[];
      const next = current.includes(item)
        ? current.filter((entry) => entry !== item)
        : [...current, item];
      patch({ [key]: next } as Partial<Preferences>);
    },
    [patch, value]
  );

  const setAllergies = useCallback(
    (next: string[]) => {
      updateAllergies.mutate(next, {
        onError: (error) => toast.showError(error, 'Your allergies could not be saved.'),
      });
    },
    [toast, updateAllergies]
  );

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Personalise"
        title="Taste and diet"
        subtitle="Plate applies these to every recipe it generates and checks each result before showing it to you."
        onBack
      />

      {preferences.isPending ? (
        <LoadingState label="Loading your preferences…" />
      ) : preferences.isError || !value ? (
        <ErrorState
          error={preferences.error}
          fallback="Your preferences could not load."
          onRetry={() => preferences.refetch()}
        />
      ) : (
        <ScreenScroll>
          <Section title="Allergies" subtitle="Treated as hard limits, never as suggestions.">
            <Notice
              tone="warning"
              icon="warning"
              message="Plate rejects any recipe containing these, including hidden sources such as soy sauce for gluten or fish sauce for fish. Always double-check labels yourself."
            />
            <ChipWrap>
              {(meta.data?.allergens ?? []).map((option) => {
                const selected = value.allergies.includes(option.value);
                return (
                  <Chip
                    key={option.value}
                    label={option.label}
                    selected={selected}
                    tone="error"
                    onPress={() =>
                      setAllergies(
                        selected
                          ? value.allergies.filter((item) => item !== option.value)
                          : [...value.allergies, option.value]
                      )
                    }
                  />
                );
              })}
            </ChipWrap>
            {updateAllergies.isPending ? (
              <AppText variant="caption" color="textTertiary">
                Saving…
              </AppText>
            ) : null}
          </Section>

          <Section title="Diet" subtitle="Also enforced on the server before a recipe reaches you.">
            <ChipWrap>
              {(meta.data?.diets ?? []).map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={value.dietaryRestrictions.includes(option.value)}
                  tone="accent"
                  onPress={() => toggleInList('dietaryRestrictions', option.value)}
                />
              ))}
            </ChipWrap>
          </Section>

          <Section title="Dislikes" subtitle="Plate avoids these but will not refuse a recipe over them.">
            <TagEditor
              values={value.dislikes}
              onChange={(next) => patch({ dislikes: next })}
              placeholder="Add something you would rather not eat"
              emptyLabel="No dislikes yet."
              busy={update.isPending}
            />
          </Section>

          <Section title="Favourites" subtitle="Ingredients you want to see more often.">
            <TagEditor
              values={value.favoriteIngredients}
              onChange={(next) => patch({ favoriteIngredients: next })}
              placeholder="Add a favourite ingredient"
              emptyLabel="No favourites yet."
              busy={update.isPending}
            />
          </Section>

          <Section title="Cuisines">
            <ChipWrap>
              {(meta.data?.cuisines ?? []).map((cuisine) => (
                <Chip
                  key={cuisine}
                  label={cuisine}
                  selected={value.favoriteCuisines.includes(cuisine)}
                  onPress={() => toggleInList('favoriteCuisines', cuisine)}
                />
              ))}
            </ChipWrap>
          </Section>

          <Section title="How you cook">
            <Card>
              <View style={styles.stack}>
                <View style={styles.field}>
                  <AppText variant="bodyStrong">Skill level</AppText>
                  <SegmentedControl
                    options={(meta.data?.cookingSkills ?? []).map((option) => ({
                      value: option.value as CookingSkill,
                      label: option.label,
                    }))}
                    value={value.cookingSkill}
                    onChange={(next) => patch({ cookingSkill: next })}
                  />
                </View>

                <View style={styles.field}>
                  <AppText variant="bodyStrong">Usual effort</AppText>
                  <SegmentedControl
                    options={(meta.data?.difficulties ?? []).map((option) => ({
                      value: option.value as Difficulty,
                      label: option.label,
                    }))}
                    value={value.preferredDifficulty}
                    onChange={(next) => patch({ preferredDifficulty: next })}
                  />
                </View>

                <View style={styles.field}>
                  <AppText variant="bodyStrong">Time you usually have</AppText>
                  <ChipWrap>
                    {TIME_CHOICES.map((minutes) => (
                      <Chip
                        key={minutes}
                        label={`${minutes} min`}
                        selected={value.preferredCookingTime === minutes}
                        onPress={() => patch({ preferredCookingTime: minutes })}
                      />
                    ))}
                  </ChipWrap>
                </View>

                <Stepper
                  label="Usual servings"
                  value={value.preferredServings}
                  min={1}
                  max={12}
                  onChange={(next) => patch({ preferredServings: next })}
                  disabled={update.isPending}
                />

                <View style={styles.field}>
                  <AppText variant="bodyStrong">Meals you cook</AppText>
                  <ChipWrap>
                    {(meta.data?.mealTypes ?? []).map((option) => (
                      <Chip
                        key={option.value}
                        label={option.label}
                        selected={value.preferredMealTypes.includes(option.value as MealType)}
                        onPress={() => toggleInList('preferredMealTypes', option.value)}
                      />
                    ))}
                  </ChipWrap>
                </View>
              </View>
            </Card>
          </Section>

          <Section title="Nutrition" subtitle="Used to steer recipes, not to police them.">
            <Card>
              <View style={styles.stack}>
                <ChipWrap>
                  {(meta.data?.nutritionFocuses ?? []).map((option) => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      selected={value.nutritionGoals.focus === option.value}
                      onPress={() =>
                        patch({
                          nutritionGoals: {
                            ...value.nutritionGoals,
                            focus: option.value as NutritionFocus,
                          },
                        })
                      }
                    />
                  ))}
                </ChipWrap>

                <View style={styles.row}>
                  <TextField
                    label="Calories per meal"
                    placeholder="Optional"
                    keyboardType="number-pad"
                    defaultValue={value.nutritionGoals.calories?.toString() ?? ''}
                    onEndEditing={(event) => {
                      const raw = event.nativeEvent.text.trim();
                      const parsed = raw ? Number(raw) : null;
                      if (raw && !Number.isFinite(parsed)) return;
                      patch({
                        nutritionGoals: { ...value.nutritionGoals, calories: parsed },
                      });
                    }}
                    containerStyle={styles.half}
                  />
                  <TextField
                    label="Protein (g)"
                    placeholder="Optional"
                    keyboardType="number-pad"
                    defaultValue={value.nutritionGoals.protein?.toString() ?? ''}
                    onEndEditing={(event) => {
                      const raw = event.nativeEvent.text.trim();
                      const parsed = raw ? Number(raw) : null;
                      if (raw && !Number.isFinite(parsed)) return;
                      patch({
                        nutritionGoals: { ...value.nutritionGoals, protein: parsed },
                      });
                    }}
                    containerStyle={styles.half}
                  />
                </View>

                <TextField
                  label="Anything else Plate should know"
                  placeholder="Low sodium, training for a race, feeding a toddler…"
                  defaultValue={value.nutritionGoals.notes}
                  multiline
                  onEndEditing={(event) =>
                    patch({
                      nutritionGoals: {
                        ...value.nutritionGoals,
                        notes: event.nativeEvent.text.trim(),
                      },
                    })
                  }
                />
              </View>
            </Card>
          </Section>

          <Section title="Shopping and units">
            <Card>
              <View style={styles.stack}>
                <View style={styles.field}>
                  <AppText variant="bodyStrong">Budget</AppText>
                  <SegmentedControl
                    options={(meta.data?.budgets ?? []).map((option) => ({
                      value: option.value as Budget,
                      label: option.label,
                    }))}
                    value={value.budget}
                    onChange={(next) => patch({ budget: next })}
                  />
                </View>
                <View style={styles.field}>
                  <AppText variant="bodyStrong">Measurements</AppText>
                  <SegmentedControl
                    options={(meta.data?.unitSystems ?? []).map((option) => ({
                      value: option.value as UnitSystem,
                      label: option.label,
                    }))}
                    value={value.preferredUnits}
                    onChange={(next) => patch({ preferredUnits: next })}
                  />
                </View>
              </View>
            </Card>
          </Section>
        </ScreenScroll>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.four,
  },
  field: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  half: {
    flex: 1,
  },
});
