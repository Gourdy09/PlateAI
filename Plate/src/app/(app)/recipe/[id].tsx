import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { IngredientList } from '@/components/recipe/ingredient-list';
import { NutritionGrid } from '@/components/recipe/nutrition-grid';
import { RecipeCover } from '@/components/recipe/recipe-cover';
import { Button, IconButton } from '@/components/ui/button';
import { Stepper, TextField } from '@/components/ui/field';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { Sheet } from '@/components/ui/sheet';
import { EmptyState, ErrorState, LoadingState, Notice } from '@/components/ui/states';
import { Card, Chip, ChipWrap, Divider, Section } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { Elevation, Radius, Spacing } from '@/constants/theme';
import { useToast } from '@/ctx/toast';
import { useTheme } from '@/hooks/use-theme';
import { useAddRecipeToCart } from '@/api/use-kitchen';
import { useOpenConversation, useStartCooking } from '@/api/use-cooking';
import { useAdaptRecipe, useRecipe, useSubstitutions, useToggleSaved } from '@/api/use-recipes';
import type { MatchedIngredient, Substitution } from '@/api/types';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const toast = useToast();

  const detail = useRecipe(id);
  const toggleSaved = useToggleSaved();
  const addToCart = useAddRecipeToCart();
  const startCooking = useStartCooking();
  const openConversation = useOpenConversation();
  const substitutions = useSubstitutions(id);
  const adapt = useAdaptRecipe(id);

  const [tab, setTab] = useState<'have' | 'missing' | 'optional'>('missing');
  const [swap, setSwap] = useState<{ ingredient: string; result: Substitution | null } | null>(null);
  const [adaptOpen, setAdaptOpen] = useState(false);
  const [servingsDraft, setServingsDraft] = useState(2);
  const [adaptNote, setAdaptNote] = useState('');

  if (detail.isPending) {
    return (
      <Screen>
        <LoadingState label="Loading recipe…" />
      </Screen>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <Screen>
        <View style={styles.errorWrap}>
          <ErrorState
            error={detail.error}
            fallback="That recipe could not be loaded."
            onRetry={() => detail.refetch()}
          />
          <Button label="Go back" variant="ghost" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const { recipe, saved, ingredients, warnings } = detail.data;
  const blocked = warnings.allergyViolations.length > 0;
  const lists: Record<typeof tab, MatchedIngredient[]> = {
    have: ingredients.have,
    missing: ingredients.missing,
    optional: ingredients.optional,
  };
  const coverage = Math.round((detail.data.fridgeCoverage ?? 0) * 100);

  const run = async (action: () => Promise<unknown>, failure: string) => {
    try {
      await action();
    } catch (error) {
      toast.showError(error, failure);
    }
  };

  const openSwap = async (ingredient: MatchedIngredient) => {
    setSwap({ ingredient: ingredient.name, result: null });
    try {
      const result = await substitutions.mutateAsync(ingredient.name);
      setSwap({ ingredient: ingredient.name, result });
    } catch (error) {
      setSwap(null);
      toast.showError(error, 'Plate could not suggest a substitute right now.');
    }
  };

  const beginCooking = () =>
    run(async () => {
      const result = await startCooking.mutateAsync({ recipeId: recipe.id });
      router.push({
        pathname: '/(app)/cook/[sessionId]',
        params: { sessionId: result.session.id },
      });
    }, 'Cooking mode could not start.');

  const askPlate = () =>
    run(async () => {
      const result = await openConversation.mutateAsync({ recipeId: recipe.id });
      router.push({ pathname: '/(app)/chat', params: { conversationId: result.conversation.id } });
    }, 'The assistant could not open.');

  return (
    <Screen edges={['left', 'right']} washes={false}>
      <ScreenScroll bottomInset={120} contentStyle={styles.content}>
        <RecipeCover recipe={recipe} style={styles.hero}>
          <View style={styles.heroActions}>
            <IconButton
              name="arrow-left"
              onPress={() => router.back()}
              accessibilityLabel="Go back"
              size={42}
            />
            <IconButton
              name="heart"
              filled={saved}
              color={saved ? theme.heart : undefined}
              onPress={() =>
                run(
                  () => toggleSaved.mutateAsync({ recipeId: recipe.id, saved }),
                  'That recipe could not be updated.'
                )
              }
              accessibilityLabel={saved ? 'Remove from saved' : 'Save recipe'}
              size={42}
              loading={toggleSaved.isPending}
            />
          </View>
        </RecipeCover>

        <View style={styles.pad}>
          <View style={styles.titleBlock}>
            <AppText variant="display">{recipe.title}</AppText>
            {recipe.description ? (
              <AppText variant="body" color="textSecondary">
                {recipe.description}
              </AppText>
            ) : null}
          </View>

          <ChipWrap>
            <Chip label={`${recipe.totalTime} min total`} icon="clock" />
            <Chip label={recipe.difficulty} icon="flame" />
            <Chip label={`${recipe.servings} servings`} icon="user" />
            {recipe.cuisine ? <Chip label={recipe.cuisine} /> : null}
            {recipe.dietaryTags.map((tag) => (
              <Chip key={tag} label={tag} tone="accent" />
            ))}
          </ChipWrap>

          {blocked ? (
            <Notice
              tone="error"
              title="This recipe conflicts with your allergies"
              message={`${warnings.allergyViolations
                .map((violation) => `${violation.label}: ${violation.matches.join(', ')}`)
                .join('; ')}. Plate will not start cooking mode for it.`}
            />
          ) : null}

          {warnings.dietViolations.length > 0 ? (
            <Notice
              tone="warning"
              title="Outside your usual diet"
              message={warnings.dietViolations
                .map((violation) => `${violation.label}: ${violation.matches.join(', ')}`)
                .join('; ')}
            />
          ) : null}

          {warnings.dislikeMatches.length > 0 ? (
            <Notice
              tone="info"
              title="Contains something you dislike"
              message={`${warnings.dislikeMatches.join(', ')}. Ask Plate for a swap if you want an alternative.`}
            />
          ) : null}

          <Section
            title="Ingredients"
            subtitle={`${coverage}% of this recipe is already in your fridge`}>
            <View style={styles.tabs}>
              <Chip
                label={`Missing ${ingredients.missing.length}`}
                selected={tab === 'missing'}
                onPress={() => setTab('missing')}
              />
              <Chip
                label={`Have ${ingredients.have.length}`}
                selected={tab === 'have'}
                onPress={() => setTab('have')}
              />
              {ingredients.optional.length > 0 ? (
                <Chip
                  label={`Optional ${ingredients.optional.length}`}
                  selected={tab === 'optional'}
                  onPress={() => setTab('optional')}
                />
              ) : null}
            </View>

            <Card>
              {lists[tab].length === 0 ? (
                <AppText variant="small" color="textSecondary">
                  {tab === 'missing'
                    ? 'You have everything for this recipe.'
                    : tab === 'have'
                      ? 'Nothing from this recipe is in your fridge yet.'
                      : 'This recipe has no optional ingredients.'}
                </AppText>
              ) : (
                <IngredientList
                  ingredients={lists[tab]}
                  state={tab}
                  onPressIngredient={openSwap}
                />
              )}
            </Card>

            {ingredients.missing.length > 0 ? (
              <Button
                label={`Add ${ingredients.missing.length} missing to cart`}
                icon="cart"
                variant="secondary"
                loading={addToCart.isPending}
                onPress={() =>
                  run(async () => {
                    await addToCart.mutateAsync({ recipeId: recipe.id, mode: 'missing' });
                    toast.show('Missing ingredients added to your cart.', 'success');
                  }, 'Those ingredients could not be added.')
                }
              />
            ) : null}
          </Section>

          <Section
            title="Method"
            subtitle={`${recipe.instructions.length} steps`}
            action={{ label: 'Adjust', onPress: () => { setServingsDraft(recipe.servings); setAdaptOpen(true); } }}>
            <Card>
              {recipe.instructions.map((step, index) => (
                <View key={index}>
                  {index > 0 ? <Divider style={styles.stepDivider} /> : null}
                  <View style={styles.step}>
                    <View style={[styles.stepNumber, { backgroundColor: theme.primaryWash }]}>
                      <AppText variant="caption" tint={theme.primary}>
                        {index + 1}
                      </AppText>
                    </View>
                    <AppText variant="body" style={styles.stepText}>
                      {step}
                    </AppText>
                  </View>
                </View>
              ))}
            </Card>
          </Section>

          <Section title="Nutrition">
            <NutritionGrid nutrition={recipe.nutrition} />
          </Section>

          {recipe.allergens.length > 0 ? (
            <Section title="Contains">
              <ChipWrap>
                {recipe.allergens.map((allergen) => (
                  <Chip key={allergen} label={allergen} tone="warning" />
                ))}
              </ChipWrap>
            </Section>
          ) : null}

          {recipe.generatedByAI ? (
            <AppText variant="caption" color="textTertiary">
              Written by Gemini from your preferences. Check seasoning and cooking times as you go.
            </AppText>
          ) : null}
        </View>
      </ScreenScroll>

      <View
        style={[
          styles.footer,
          Elevation.raised,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}>
        <Button
          label={blocked ? 'Blocked by your allergies' : 'Start cooking'}
          icon="utensils"
          onPress={beginCooking}
          disabled={blocked}
          loading={startCooking.isPending}
          style={styles.footerPrimary}
        />
        <IconButton
          name="mic"
          onPress={askPlate}
          accessibilityLabel="Ask Plate about this recipe"
          size={54}
          loading={openConversation.isPending}
        />
      </View>

      <Sheet
        visible={swap !== null}
        onClose={() => setSwap(null)}
        title={`Substitutes for ${swap?.ingredient ?? ''}`}
        subtitle="Suggestions respect your allergies and diet.">
        {swap?.result ? (
          swap.result.options.length === 0 ? (
            <EmptyState
              icon="info"
              title="No safe swap found"
              description="Plate could not find a substitute that fits your restrictions for this ingredient."
            />
          ) : (
            <>
              {swap.result.options.map((option) => (
                <Card key={option.name}>
                  <AppText variant="bodyStrong">{option.name}</AppText>
                  {option.amount ? (
                    <AppText variant="small" color="textSecondary">
                      Use {option.amount}
                    </AppText>
                  ) : null}
                  {option.impact ? (
                    <AppText variant="small" color="textSecondary">
                      {option.impact}
                    </AppText>
                  ) : null}
                </Card>
              ))}
              {swap.result.notes ? (
                <AppText variant="small" color="textSecondary">
                  {swap.result.notes}
                </AppText>
              ) : null}
            </>
          )
        ) : (
          <LoadingState label="Looking for a safe substitute…" compact />
        )}
      </Sheet>

      <Sheet
        visible={adaptOpen}
        onClose={() => setAdaptOpen(false)}
        title="Adjust this recipe"
        subtitle="Plate rewrites the amounts and steps, then re-checks it against your allergies."
        footer={
          <Button
            label="Create adjusted version"
            icon="refresh"
            loading={adapt.isPending}
            onPress={() =>
              run(async () => {
                const next = await adapt.mutateAsync({
                  servings: servingsDraft,
                  instruction: adaptNote.trim() || undefined,
                });
                setAdaptOpen(false);
                setAdaptNote('');
                router.push({ pathname: '/(app)/recipe/[id]', params: { id: next.id } });
              }, 'That adjustment could not be made.')
            }
          />
        }>
        <Stepper label="Servings" value={servingsDraft} onChange={setServingsDraft} min={1} max={16} />
        <TextField
          label="Anything else?"
          placeholder="Make it dairy free, use the oven instead of a grill…"
          value={adaptNote}
          onChangeText={setAdaptNote}
          multiline
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    gap: 0,
  },
  pad: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  hero: {
    height: 280,
    justifyContent: 'flex-start',
  },
  heroActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.five + Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  titleBlock: {
    gap: Spacing.two,
  },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  step: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  stepDivider: {
    marginVertical: Spacing.three,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four + Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  footerPrimary: {
    flex: 1,
  },
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
  },
});
