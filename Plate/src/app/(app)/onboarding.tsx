import { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import {
  ArrowLeftCircle,
  ArrowRightCircle,
  CheckCircleIcon,
  UtensilsCrossed,
} from '@/components/auth/icons';
import {
  DIETS,
  getDiet,
  ingredientsForDiet,
  type DietId,
  type FoodPreferences,
} from '@/components/onboarding/preferences-data';
import { Plate, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const HOME = '/(app)/(tabs)' as const;

type StepKey = 'diet' | 'onhand' | 'buy';

export default function OnboardingScreen() {
  const theme = useTheme();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  // "ingredients" mode is the homepage shortcut: skip the diet step and only
  // let the user refresh what they have and what they would buy.
  const ingredientsOnly = mode === 'ingredients';
  const stepKeys = useMemo<StepKey[]>(
    () => (ingredientsOnly ? ['onhand', 'buy'] : ['diet', 'onhand', 'buy']),
    [ingredientsOnly]
  );
  const totalSteps = stepKeys.length;

  const [step, setStep] = useState(0);
  const [diet, setDiet] = useState<DietId | null>(null);
  const [dietNotes, setDietNotes] = useState('');
  const [onHand, setOnHand] = useState<string[]>([]);
  const [willingToBuy, setWillingToBuy] = useState<string[]>([]);
  const [extraOnHand, setExtraOnHand] = useState<string[]>([]);
  const [extraToBuy, setExtraToBuy] = useState<string[]>([]);

  const currentKey = stepKeys[step];
  // The diet step needs either a preset pick or free-text details before moving
  // on; every ingredient step is optional.
  const canAdvance = currentKey === 'diet' ? diet !== null || dietNotes.trim().length > 0 : true;

  function toggle(list: string[], setList: (next: string[]) => void, name: string) {
    setList(list.includes(name) ? list.filter((item) => item !== name) : [...list, name]);
  }

  function addCustom(
    raw: string,
    extras: string[],
    setExtras: (next: string[]) => void,
    selected: string[],
    setSelected: (next: string[]) => void
  ) {
    const name = raw.trim();
    if (!name) return;
    const exists =
      extras.some((item) => item.toLowerCase() === name.toLowerCase()) ||
      ingredientsForDiet(diet).some((group) =>
        group.items.some((item) => item.name.toLowerCase() === name.toLowerCase())
      );
    if (!exists) setExtras([...extras, name]);
    if (!selected.some((item) => item.toLowerCase() === name.toLowerCase())) {
      setSelected([...selected, name]);
    }
  }

  function handleNext() {
    if (!canAdvance) return;
    if (step < totalSteps - 1) {
      setStep(step + 1);
      return;
    }
    finish();
  }

  function handleBack() {
    if (step === 0) {
      router.back();
      return;
    }
    setStep(step - 1);
  }

  function finish() {
    const preferences: FoodPreferences = {
      diet: diet ?? 'anything',
      dietNotes: dietNotes.trim() || undefined,
      ingredientsOnHand: onHand,
      ingredientsWillingToBuy: willingToBuy,
    };
    // Persistence to the backend is wired up in a later step.
    console.log('Collected food preferences:', preferences);
    router.replace(HOME);
  }

  const stepMeta = metaForStep(currentKey, step, totalSteps);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View
        pointerEvents="none"
        style={[styles.herbWash, { backgroundColor: Plate.herbWash, opacity: 0.48 }]}
      />
      <View
        pointerEvents="none"
        style={[styles.spiceWash, { backgroundColor: Plate.spiceWash, opacity: 0.5 }]}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          <View style={styles.main}>
            <ProgressHeader step={step} totalSteps={totalSteps} />

            <View style={styles.intro}>
              <View style={styles.eyebrow}>
                <UtensilsCrossed size={15} color={theme.primary} />
                <Text style={[styles.eyebrowText, { color: theme.primary }]}>{stepMeta.eyebrow}</Text>
              </View>
              <Text style={[styles.title, { color: theme.text }]}>{stepMeta.title}</Text>
              <Text style={[styles.description, { color: theme.textSecondary }]}>
                {stepMeta.description}
              </Text>
            </View>

            {currentKey === 'diet' ? (
              <DietStep
                selected={diet}
                onSelect={setDiet}
                notes={dietNotes}
                onChangeNotes={setDietNotes}
              />
            ) : currentKey === 'onhand' ? (
              <IngredientStep
                diet={diet}
                selected={onHand}
                extras={extraOnHand}
                onToggle={(name) => toggle(onHand, setOnHand, name)}
                onAddCustom={(raw) =>
                  addCustom(raw, extraOnHand, setExtraOnHand, onHand, setOnHand)
                }
                placeholder="Add something you have…"
              />
            ) : (
              <IngredientStep
                diet={diet}
                selected={willingToBuy}
                extras={extraToBuy}
                onToggle={(name) => toggle(willingToBuy, setWillingToBuy, name)}
                onAddCustom={(raw) =>
                  addCustom(raw, extraToBuy, setExtraToBuy, willingToBuy, setWillingToBuy)
                }
                placeholder="Add something you'd buy…"
                excludeNames={onHand}
                emptyHint="Everything you picked as on hand is hidden here."
              />
            )}
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={handleBack}
              accessibilityRole="button"
              style={[styles.backButton, { borderColor: theme.inputBorder }]}>
              <ArrowLeftCircle size={16} color={theme.text} />
              <Text style={[styles.backLabel, { color: theme.text }]}>Back</Text>
            </Pressable>
            <Pressable
              onPress={handleNext}
              disabled={!canAdvance}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.nextButton,
                { opacity: !canAdvance ? 0.5 : pressed ? 0.9 : 1 },
              ]}>
              <Text style={styles.nextLabel}>
                {step === totalSteps - 1 ? 'Finish' : 'Next'}
              </Text>
              <ArrowRightCircle size={18} color="#ffffff" />
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const STEP_COPY: Record<StepKey, { title: string; description: string }> = {
  diet: {
    title: 'What kind of diet do you follow?',
    description: 'Pick the eating style that fits you best. We use it to tailor every recipe we suggest.',
  },
  onhand: {
    title: 'What ingredients do you have on hand?',
    description: 'Select what is already in your kitchen — or add your own. We will build recipes around these first.',
  },
  buy: {
    title: 'What additional ingredients can you buy?',
    description:
      'Optional — tell us what you would happily pick up so we can round out your recipes. Anything you already have is hidden here.',
  },
};

function metaForStep(key: StepKey, step: number, totalSteps: number) {
  return {
    eyebrow: `STEP ${step + 1} OF ${totalSteps}`,
    ...STEP_COPY[key],
  };
}

function ProgressHeader({ step, totalSteps }: { step: number; totalSteps: number }) {
  const theme = useTheme();
  return (
    <View style={styles.progressRow}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressSegment,
            {
              backgroundColor: index <= step ? theme.primary : theme.inputBorder,
            },
          ]}
        />
      ))}
    </View>
  );
}

function DietStep({
  selected,
  onSelect,
  notes,
  onChangeNotes,
}: {
  selected: DietId | null;
  onSelect: (id: DietId) => void;
  notes: string;
  onChangeNotes: (next: string) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.dietStep}>
      <View style={styles.dietList}>
        {DIETS.map((option) => {
          const active = selected === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => onSelect(option.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[
                styles.dietCard,
                {
                  backgroundColor: active ? theme.backgroundSelected : theme.card,
                  borderColor: active ? theme.primary : theme.inputBorder,
                },
              ]}>
              <View style={styles.dietCopy}>
                <Text style={[styles.dietLabel, { color: theme.text }]}>{option.label}</Text>
                <Text style={[styles.dietDescription, { color: theme.textSecondary }]}>
                  {option.description}
                </Text>
              </View>
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: active ? theme.primary : theme.inputBorder,
                    backgroundColor: active ? theme.primary : 'transparent',
                  },
                ]}>
                {active ? <CheckCircleIcon size={16} color="#ffffff" /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.notesBlock}>
        <Text style={[styles.notesLabel, { color: theme.text }]}>Anything else? (optional)</Text>
        <Text style={[styles.notesHelp, { color: theme.textSecondary }]}>
          Add details the options above miss — like &ldquo;can&rsquo;t eat eggs&rdquo; or
          &ldquo;low sodium.&rdquo; You can also just describe your diet here in your own words.
        </Text>
        <TextInput
          value={notes}
          onChangeText={onChangeNotes}
          placeholder="e.g. vegetarian and can't eat eggs"
          placeholderTextColor={theme.textSecondary}
          multiline
          textAlignVertical="top"
          style={[
            styles.notesInput,
            { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text },
          ]}
        />
      </View>
    </View>
  );
}

function IngredientStep({
  diet,
  selected,
  extras,
  onToggle,
  onAddCustom,
  placeholder,
  excludeNames = [],
  emptyHint,
}: {
  diet: DietId | null;
  selected: string[];
  extras: string[];
  onToggle: (name: string) => void;
  onAddCustom: (raw: string) => void;
  placeholder: string;
  /** Names to hide from the presets (e.g. things already marked on hand). */
  excludeNames?: string[];
  emptyHint?: string;
}) {
  const theme = useTheme();
  const [draft, setDraft] = useState('');
  const excluded = useMemo(
    () => new Set(excludeNames.map((name) => name.toLowerCase())),
    [excludeNames]
  );
  const groups = useMemo(
    () =>
      ingredientsForDiet(diet)
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => !excluded.has(item.name.toLowerCase())),
        }))
        .filter((group) => group.items.length > 0),
    [diet, excluded]
  );
  const visibleExtras = useMemo(
    () => extras.filter((name) => !excluded.has(name.toLowerCase())),
    [extras, excluded]
  );
  const dietLabel = getDiet(diet)?.label;

  function submitDraft() {
    onAddCustom(draft);
    setDraft('');
  }

  return (
    <View style={styles.ingredientBody}>
      <View style={[styles.addRow, { backgroundColor: theme.input, borderColor: theme.inputBorder }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={submitDraft}
          returnKeyType="done"
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          style={[styles.addInput, { color: theme.text }]}
        />
        <Pressable
          onPress={submitDraft}
          disabled={!draft.trim()}
          accessibilityRole="button"
          style={[styles.addButton, { backgroundColor: theme.primary, opacity: draft.trim() ? 1 : 0.5 }]}>
          <Text style={styles.addButtonLabel}>Add</Text>
        </Pressable>
      </View>

      {visibleExtras.length > 0 ? (
        <View style={styles.categoryBlock}>
          <Text style={[styles.categoryTitle, { color: theme.textSecondary }]}>Your additions</Text>
          <View style={styles.chipWrap}>
            {visibleExtras.map((name) => (
              <SelectChip
                key={`extra-${name}`}
                label={name}
                selected={selected.includes(name)}
                onPress={() => onToggle(name)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {emptyHint && groups.length === 0 && visibleExtras.length === 0 ? (
        <Text style={[styles.dietHint, { color: theme.textSecondary }]}>{emptyHint}</Text>
      ) : null}

      {groups.map((group) => (
        <View key={group.category} style={styles.categoryBlock}>
          <Text style={[styles.categoryTitle, { color: theme.textSecondary }]}>{group.category}</Text>
          <View style={styles.chipWrap}>
            {group.items.map((item) => (
              <SelectChip
                key={item.name}
                label={item.name}
                selected={selected.includes(item.name)}
                onPress={() => onToggle(item.name)}
              />
            ))}
          </View>
        </View>
      ))}

      {dietLabel && dietLabel !== 'No restrictions' ? (
        <Text style={[styles.dietHint, { color: theme.textSecondary }]}>
          Showing ingredients that fit a {dietLabel.toLowerCase()} diet.
        </Text>
      ) : null}
    </View>
  );
}

function SelectChip({
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
      accessibilityRole="button"
      accessibilityState={{ selected }}
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
          { color: selected ? '#ffffff' : theme.chipText, fontWeight: selected ? '600' : '500' },
        ]}
        numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  safe: {
    flex: 1,
  },
  herbWash: {
    position: 'absolute',
    top: 72,
    right: -34,
    width: 138,
    height: 138,
    borderRadius: 69,
  },
  spiceWash: {
    position: 'absolute',
    bottom: 100,
    left: -56,
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  main: {
    gap: Spacing.four,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    borderRadius: Radius.pill,
  },
  intro: {
    gap: 9,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '400',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  dietStep: {
    gap: Spacing.four,
  },
  dietList: {
    gap: Spacing.two,
  },
  notesBlock: {
    gap: 8,
  },
  notesLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  notesHelp: {
    fontSize: 13,
    lineHeight: 18,
  },
  notesInput: {
    minHeight: 84,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 15,
  },
  dietCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
  },
  dietCopy: {
    flex: 1,
    gap: 3,
  },
  dietLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  dietDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientBody: {
    gap: Spacing.three,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingLeft: Spacing.three,
    paddingRight: 6,
  },
  addInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  addButton: {
    borderRadius: Radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addButtonLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  categoryBlock: {
    gap: 8,
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    maxWidth: '100%',
  },
  chipLabel: {
    fontSize: 13,
  },
  dietHint: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    paddingHorizontal: 22,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  backLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Plate.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  nextLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
