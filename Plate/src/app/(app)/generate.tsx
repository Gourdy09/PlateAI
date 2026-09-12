import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { RecipeListItem } from '@/components/recipe/recipe-list-item';
import { Button } from '@/components/ui/button';
import { SegmentedControl, Stepper, TextField, ToggleRow } from '@/components/ui/field';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/screen';
import { LoadingState, Notice } from '@/components/ui/states';
import { Card, Chip, ChipWrap, Section } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useToast } from '@/ctx/toast';
import { useBootstrap } from '@/api/use-account';
import { useFridge } from '@/api/use-kitchen';
import { useFridgeRecipes, useGenerateRecipe } from '@/api/use-recipes';
import type { Recipe } from '@/api/types';

type Mode = 'fridge' | 'request';

const IDEAS = [
  'Something warm and cheap',
  'High protein, 20 minutes',
  'Use up leftover rice',
  'Weeknight dinner for two',
];

/**
 * Ask Plate for a recipe: either from what is in the fridge, or from a request in
 * plain words. Both paths generate, validate against allergies, and store real
 * recipes on the server before returning.
 */
export default function GenerateScreen() {
  const router = useRouter();
  const toast = useToast();

  const bootstrap = useBootstrap();
  const fridge = useFridge();
  const fromFridge = useFridgeRecipes();
  const fromPrompt = useGenerateRecipe();

  const [mode, setMode] = useState<Mode>('fridge');
  const [prompt, setPrompt] = useState('');
  const [count, setCount] = useState(3);
  const [strict, setStrict] = useState(false);
  const [notes, setNotes] = useState('');
  const [results, setResults] = useState<(Recipe & { missingIngredients?: string[] })[]>([]);

  const items = fridge.data ?? [];
  const aiAvailable = bootstrap.data?.capabilities.ai ?? true;
  const pending = fromFridge.isPending || fromPrompt.isPending;

  const generate = async () => {
    setResults([]);
    try {
      if (mode === 'fridge') {
        const recipes = await fromFridge.mutateAsync({
          count,
          strict,
          notes: notes.trim() || undefined,
        });
        setResults(recipes);
      } else {
        const recipe = await fromPrompt.mutateAsync({ prompt: prompt.trim() });
        setResults([recipe]);
      }
    } catch (error) {
      toast.showError(error, 'Plate could not create a safe recipe for that. Try rewording it.');
    }
  };

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Make something"
        title="Ask for a recipe"
        subtitle="Plate writes it against your allergies and diet, then checks the result before showing it."
        onBack
      />

      <ScreenScroll>
        {!aiAvailable ? (
          <Notice
            tone="warning"
            title="Recipe generation is unavailable"
            message="This Plate server has no Gemini API key configured, so new recipes cannot be created."
          />
        ) : null}

        <SegmentedControl
          options={[
            { value: 'fridge' as Mode, label: 'From my fridge' },
            { value: 'request' as Mode, label: 'Describe it' },
          ]}
          value={mode}
          onChange={setMode}
        />

        {mode === 'fridge' ? (
          <Card>
            <View style={styles.stack}>
              {items.length === 0 ? (
                <Notice
                  tone="info"
                  message="Your fridge is empty, so Plate has nothing to work from. Add a few ingredients first."
                  action={{ label: 'Open my fridge', onPress: () => router.push('/(app)/fridge') }}
                />
              ) : (
                <>
                  <AppText variant="small" color="textSecondary">
                    Working from {items.length} ingredient{items.length === 1 ? '' : 's'} in your fridge.
                  </AppText>
                  <Stepper label="How many ideas" value={count} min={1} max={5} onChange={setCount} />
                  <ToggleRow
                    label="Only what I already have"
                    description="Off means Plate may add a couple of easy extras to the shopping list."
                    value={strict}
                    onValueChange={setStrict}
                  />
                  <TextField
                    label="Anything to steer it?"
                    placeholder="Nothing fried, use the oven, feed three people…"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                  />
                </>
              )}
            </View>
          </Card>
        ) : (
          <Card>
            <View style={styles.stack}>
              <TextField
                label="What do you feel like?"
                placeholder="A comforting one-pan dinner with chicken"
                value={prompt}
                onChangeText={setPrompt}
                multiline
              />
              <ChipWrap>
                {IDEAS.map((idea) => (
                  <Chip key={idea} label={idea} onPress={() => setPrompt(idea)} />
                ))}
              </ChipWrap>
            </View>
          </Card>
        )}

        <Button
          label={mode === 'fridge' ? 'Find recipes' : 'Create this recipe'}
          icon="utensils"
          onPress={generate}
          loading={pending}
          disabled={
            !aiAvailable ||
            (mode === 'fridge' ? items.length === 0 : prompt.trim().length < 3)
          }
        />

        {pending ? (
          <LoadingState label="Plate is writing and checking the recipe. This takes a moment." />
        ) : null}

        {results.length > 0 ? (
          <Section title="What Plate came up with">
            {results.map((recipe) => (
              <RecipeListItem
                key={recipe.id}
                recipe={recipe}
                note={
                  recipe.missingIngredients?.length
                    ? `Still need: ${recipe.missingIngredients.slice(0, 4).join(', ')}`
                    : recipe.missingIngredients
                      ? 'Everything is already in your fridge'
                      : undefined
                }
                onPress={() =>
                  router.push({ pathname: '/(app)/recipe/[id]', params: { id: recipe.id } })
                }
              />
            ))}
          </Section>
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.three,
  },
});
