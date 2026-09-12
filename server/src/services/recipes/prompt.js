import { SUPPORTED_ALLERGENS } from './safety.js';

export const RECIPE_SYSTEM_INSTRUCTION = `You are the recipe engine behind Plate, a personal cooking app.

Rules you must never break:
- Allergies are absolute. If an allergen is listed, no ingredient may contain it, including hidden sources (soy sauce contains wheat, worcestershire contains anchovy, pesto often contains nuts and cheese).
- Dietary restrictions are absolute in the same way.
- Only use cooking techniques and equipment a home cook has.
- Quantities must be specific and usable. Never write "some" or "as needed" for a main ingredient.
- Instructions must be complete, ordered, and each step must be a single action a cook can follow while standing at the stove.
- Nutrition figures are per serving and must be realistic estimates for the ingredients listed.
- Write in plain, warm, direct language. No emoji. No marketing adjectives stacked together.
- List every allergen actually present in the recipe in the allergens field.`;

function list(values, fallback = 'none') {
  const filtered = (values || []).map((value) => String(value).trim()).filter(Boolean);
  return filtered.length ? filtered.join(', ') : fallback;
}

/**
 * Builds the constraint block shared by every recipe prompt. Only preference data
 * relevant to cooking is included — never the user's identity or contact details.
 */
export function constraintBlock({ preferences, fridgeItems = [], includeFridge = false }) {
  const lines = [
    `ALLERGIES (hard constraint, never include, including hidden sources): ${list(preferences.allergies)}`,
    `DIETARY RESTRICTIONS (hard constraint): ${list(preferences.dietaryRestrictions)}`,
    `DISLIKED INGREDIENTS (avoid unless essential): ${list(preferences.dislikes)}`,
    `FAVORITE INGREDIENTS (prefer when they fit): ${list(preferences.favoriteIngredients)}`,
    `FAVORITE CUISINES: ${list(preferences.favoriteCuisines, 'no preference')}`,
    `COOKING SKILL: ${preferences.cookingSkill}`,
    `TARGET ACTIVE TIME: about ${preferences.preferredCookingTime} minutes`,
    `DEFAULT SERVINGS: ${preferences.preferredServings}`,
    `PREFERRED DIFFICULTY: ${preferences.preferredDifficulty}`,
    `MEASUREMENT SYSTEM: ${preferences.preferredUnits}`,
    `BUDGET: ${preferences.budget}`,
    `NUTRITION FOCUS: ${preferences.nutritionGoals?.focus || 'balanced'}`,
  ];

  const goals = preferences.nutritionGoals || {};
  const targets = [
    goals.calories ? `${goals.calories} kcal` : null,
    goals.protein ? `${goals.protein}g protein` : null,
    goals.carbs ? `${goals.carbs}g carbs` : null,
    goals.fat ? `${goals.fat}g fat` : null,
  ].filter(Boolean);
  if (targets.length) lines.push(`PER-SERVING TARGETS (approximate): ${targets.join(', ')}`);
  if (goals.notes) lines.push(`USER NUTRITION NOTES: ${goals.notes}`);

  if (includeFridge) {
    const items = fridgeItems.map((item) =>
      [item.quantity, item.unit, item.name].filter(Boolean).join(' ')
    );
    lines.push(`INGREDIENTS THE USER ALREADY HAS: ${list(items, 'nothing recorded')}`);
  }

  lines.push(
    `ALLERGEN VOCABULARY for the allergens field, use these labels where they apply: ${SUPPORTED_ALLERGENS.join(', ')}`
  );

  return lines.join('\n');
}

export function discoveryPrompt({
  preferences,
  fridgeItems,
  count,
  mealType,
  maxTime,
  servings,
  difficulty,
  cuisine,
  excludeTitles = [],
  likedTitles = [],
  passedTitles = [],
  extraInstructions = '',
}) {
  const parts = [
    `Create ${count} distinct recipes for this cook's discovery feed.`,
    constraintBlock({ preferences, fridgeItems, includeFridge: true }),
    mealType ? `MEAL TYPE: ${mealType}` : '',
    maxTime ? `MAXIMUM TOTAL TIME: ${maxTime} minutes` : '',
    servings ? `SERVINGS: ${servings}` : '',
    difficulty ? `DIFFICULTY: ${difficulty}` : '',
    cuisine ? `CUISINE: ${cuisine}` : '',
    likedTitles.length
      ? `THE COOK RECENTLY SAVED THESE, so lean toward similar flavours and formats: ${list(likedTitles)}`
      : '',
    passedTitles.length
      ? `THE COOK RECENTLY SKIPPED THESE, so avoid recipes that feel like them: ${list(passedTitles)}`
      : '',
    excludeTitles.length ? `DO NOT REPEAT these recipes: ${list(excludeTitles)}` : '',
    'Vary the protein, cooking method, and cuisine across the set so the feed does not feel repetitive.',
    'Using ingredients the cook already has is a bonus, not a requirement.',
    extraInstructions,
  ];
  return parts.filter(Boolean).join('\n\n');
}

export function fridgePrompt({
  preferences,
  fridgeItems,
  count,
  mealType,
  maxTime,
  servings,
  difficulty,
  notes,
  strict,
}) {
  const parts = [
    `Create ${count} recipes built around what this cook already has in their kitchen.`,
    constraintBlock({ preferences, fridgeItems, includeFridge: true }),
    strict
      ? 'Use ONLY the listed ingredients plus basic pantry staples (salt, pepper, oil, water). Do not require anything else.'
      : 'Prefer the listed ingredients. You may add at most three easy-to-buy extras per recipe.',
    mealType ? `MEAL TYPE: ${mealType}` : '',
    maxTime ? `MAXIMUM TOTAL TIME: ${maxTime} minutes` : '',
    servings ? `SERVINGS: ${servings}` : '',
    difficulty ? `DIFFICULTY: ${difficulty}` : '',
    notes ? `EXTRA REQUEST FROM THE COOK: ${notes}` : '',
    'Call out anything close to expiring that the recipe helps use up, inside the description.',
  ];
  return parts.filter(Boolean).join('\n\n');
}

export function retryHardening(violations) {
  const labels = [
    ...violations.allergyViolations.map((item) => `${item.label} (found: ${item.matches.join(', ')})`),
    ...violations.dietViolations.map((item) => `${item.label} (found: ${item.matches.join(', ')})`),
  ];
  return `Your previous attempt violated the cook's hard constraints: ${labels.join('; ')}.
Regenerate completely different recipes. Re-read every ingredient, including sauces, stocks, and condiments, and confirm none contain the forbidden items.`;
}
