import { unprocessable } from '../../lib/errors.js';
import { Recipe, recipeFingerprint } from '../../models/Recipe.js';
import { generateStructured } from '../gemini/client.js';
import { attachImages } from '../images/index.js';
import {
  RECIPE_SYSTEM_INSTRUCTION,
  discoveryPrompt,
  fridgePrompt,
  retryHardening,
} from './prompt.js';
import { recipeBatchResponseSchema, recipeBatchZod } from './schema.js';
import { checkRecipeAgainstUser, detectAllergens } from './safety.js';

function constraintsFrom(preferences) {
  return {
    allergies: preferences.allergies || [],
    dietaryRestrictions: preferences.dietaryRestrictions || [],
    dislikes: preferences.dislikes || [],
  };
}

/**
 * Generates recipes and drops anything that violates a hard constraint. If the
 * whole batch is rejected we tell Gemini exactly what went wrong and try once
 * more; a second failure surfaces as an error rather than an unsafe recipe.
 */
async function generateSafeBatch({ prompt, preferences, count, temperature }) {
  const constraints = constraintsFrom(preferences);
  let currentPrompt = prompt;
  let lastRejection = null;

  for (let round = 0; round < 2; round += 1) {
    const { recipes } = await generateStructured({
      prompt: currentPrompt,
      systemInstruction: RECIPE_SYSTEM_INSTRUCTION,
      responseSchema: recipeBatchResponseSchema,
      validate: recipeBatchZod,
      temperature,
      context: 'recipe batch',
    });

    const safe = [];
    const rejected = [];
    for (const recipe of recipes) {
      const check = checkRecipeAgainstUser(recipe, constraints);
      if (check.safe) safe.push({ ...recipe, allergens: detectAllergens(recipe) });
      else rejected.push(check);
    }

    if (safe.length) {
      return { recipes: safe.slice(0, count), rejectedCount: rejected.length };
    }

    lastRejection = rejected[0];
    currentPrompt = `${prompt}\n\n${retryHardening(lastRejection)}`;
  }

  throw unprocessable(
    'Plate could not build a recipe that fits your allergies and dietary settings. Try loosening a filter or asking for something different.',
    {
      internalMessage: `All generated recipes violated hard constraints: ${JSON.stringify(
        lastRejection ?? {}
      ).slice(0, 400)}`,
    }
  );
}

export async function generateDiscoveryRecipes({ preferences, fridgeItems, options = {}, signals = {} }) {
  const count = Math.min(Math.max(options.count ?? 6, 1), 10);
  const prompt = discoveryPrompt({
    preferences,
    fridgeItems,
    count,
    mealType: options.mealType,
    maxTime: options.maxTime,
    servings: options.servings,
    difficulty: options.difficulty,
    cuisine: options.cuisine,
    excludeTitles: signals.excludeTitles,
    likedTitles: signals.likedTitles,
    passedTitles: signals.passedTitles,
  });

  const { recipes } = await generateSafeBatch({ prompt, preferences, count, temperature: 1 });
  return attachImages(recipes);
}

export async function generateFridgeRecipes({ preferences, fridgeItems, options = {} }) {
  if (!fridgeItems.length) {
    throw unprocessable('Add a few ingredients to My Fridge first, then Plate can build recipes around them.');
  }

  const count = Math.min(Math.max(options.count ?? 3, 1), 6);
  const prompt = fridgePrompt({
    preferences,
    fridgeItems,
    count,
    mealType: options.mealType,
    maxTime: options.maxTime,
    servings: options.servings,
    difficulty: options.difficulty,
    notes: options.notes,
    strict: Boolean(options.strict),
  });

  const { recipes } = await generateSafeBatch({ prompt, preferences, count, temperature: 0.9 });
  return attachImages(recipes);
}

export async function generateRequestedRecipe({ preferences, fridgeItems, request, options = {} }) {
  const prompt = discoveryPrompt({
    preferences,
    fridgeItems,
    count: 1,
    mealType: options.mealType,
    maxTime: options.maxTime,
    servings: options.servings,
    difficulty: options.difficulty,
    cuisine: options.cuisine,
    extraInstructions: `THE COOK ASKED FOR: ${request}\nHonour this request as closely as the hard constraints allow.`,
  });

  const { recipes } = await generateSafeBatch({ prompt, preferences, count: 1, temperature: 0.85 });
  const [withImage] = await attachImages(recipes);
  return withImage;
}

/**
 * Stores generated recipes, reusing an existing document when the fingerprint
 * matches so repeated generation does not fill the collection with duplicates.
 */
export async function persistRecipes(recipes, { userId, source = 'gemini', generationPrompt = '' }) {
  const stored = [];

  for (const recipe of recipes) {
    const fingerprint = recipeFingerprint(recipe);
    const document = {
      ...recipe,
      userId,
      fingerprint,
      source,
      generatedByAI: source === 'gemini',
      generationPrompt: generationPrompt.slice(0, 600),
      allergens: recipe.allergens?.length ? recipe.allergens : detectAllergens(recipe),
    };

    const saved = await Recipe.findOneAndUpdate(
      { userId, fingerprint },
      { $setOnInsert: document },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    stored.push(saved);
  }

  return stored;
}
