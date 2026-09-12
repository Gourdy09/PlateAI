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
import { router } from 'expo-router';

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
const TOTAL_STEPS = 3;

export default function OnboardingScreen() {
  const theme = useTheme();

  const [step, setStep] = useState(0);
  const [diet, setDiet] = useState<DietId | null>(null);
  const [onHand, setOnHand] = useState<string[]>([]);
  const [willingToBuy, setWillingToBuy] = useState<string[]>([]);
  const [extraOnHand, setExtraOnHand] = useState<string[]>([]);
  const [extraToBuy, setExtraToBuy] = useState<string[]>([]);

  const canAdvance = step === 0 ? diet !== null : true;

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
    if (step < TOTAL_STEPS - 1) {
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
    if (!diet) return;
    const preferences: FoodPreferences = {
      diet,
      ingredientsOnHand: onHand,
      ingredientsWillingToBuy: willingToBuy,
    };
    // Persistence to the backend is wired up in a later step.
    console.log('Collected food preferences:', preferences);
    router.replace(HOME);
  }

  const stepMeta = STEP_META[step];

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
            <ProgressHeader step={step} />

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

            {step === 0 ? (
              <DietStep selected={diet} onSelect={setDiet} />
            ) : step === 1 ? (
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
                {step === TOTAL_STEPS - 1 ? 'Finish' : 'Next'}
              </Text>
              <ArrowRightCircle size={18} color="#ffffff" />
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const STEP_META = [
  {
    eyebrow: 'STEP 1 OF 3',
    title: 'What kind of diet do you follow?',
    description: 'Pick the eating style that fits you best. We use it to tailor every recipe we suggest.',
  },
  {
    eyebrow: 'STEP 2 OF 3',
    title: 'What ingredients do you have on hand?',
    description: 'Select what is already in your kitchen — or add your own. We will build recipes around these first.',
  },
  {
    eyebrow: 'STEP 3 OF 3',
    title: 'What are you willing to buy?',
    description: 'Tell us what you would happily pick up so we can round out your recipes.',
  },
] as const;

function ProgressHeader({ step }: { step: number }) {
  const theme = useTheme();
  return (
    <View style={styles.progressRow}>
      {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
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
}: {
  selected: DietId | null;
  onSelect: (id: DietId) => void;
}) {
  const theme = useTheme();
  return (
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
  );
}

function IngredientStep({
  diet,
  selected,
  extras,
  onToggle,
  onAddCustom,
  placeholder,
}: {
  diet: DietId | null;
  selected: string[];
  extras: string[];
  onToggle: (name: string) => void;
  onAddCustom: (raw: string) => void;
  placeholder: string;
}) {
  const theme = useTheme();
  const [draft, setDraft] = useState('');
  const groups = useMemo(() => ingredientsForDiet(diet), [diet]);
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

      {extras.length > 0 ? (
        <View style={styles.categoryBlock}>
          <Text style={[styles.categoryTitle, { color: theme.textSecondary }]}>Your additions</Text>
          <View style={styles.chipWrap}>
            {extras.map((name) => (
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
  dietList: {
    gap: Spacing.two,
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
