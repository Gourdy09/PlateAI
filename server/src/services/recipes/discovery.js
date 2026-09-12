import { FridgeItem } from '../../models/FridgeItem.js';
import { Recipe } from '../../models/Recipe.js';
import { SavedRecipe } from '../../models/SavedRecipe.js';
import { Swipe } from '../../models/Swipe.js';
import { compareIngredients, fridgeCoverage } from '../ingredients/match.js';
import { generateDiscoveryRecipes, persistRecipes } from './generate.js';
import { checkRecipeAgainstUser } from './safety.js';

const CANDIDATE_POOL = 200;
const RECENT_SIGNAL_COUNT = 12;

/**
 * Aggregates swipe history into per-cuisine and per-tag affinity so the feed
 * shifts toward what the cook actually keeps.
 */
export async function buildTasteProfile(userId) {
  const swipes = await Swipe.find({ userId }).sort({ createdAt: -1 }).limit(300).lean();
  if (!swipes.length) {
    return { cuisines: new Map(), tags: new Map(), likedTitles: [], passedTitles: [], swipedIds: [] };
  }

  const recipes = await Recipe.find({ _id: { $in: swipes.map((swipe) => swipe.recipeId) } })
    .select('title cuisine dietaryTags difficulty totalTime')
    .lean();
  const byId = new Map(recipes.map((recipe) => [recipe._id.toString(), recipe]));

  const cuisines = new Map();
  const tags = new Map();
  const likedTitles = [];
  const passedTitles = [];

  for (const swipe of swipes) {
    const recipe = byId.get(swipe.recipeId.toString());
    if (!recipe) continue;
    const weight = swipe.direction === 'right' ? 1 : -0.6;

    if (recipe.cuisine) {
      cuisines.set(recipe.cuisine.toLowerCase(), (cuisines.get(recipe.cuisine.toLowerCase()) ?? 0) + weight);
    }
    for (const tag of recipe.dietaryTags || []) {
      tags.set(tag.toLowerCase(), (tags.get(tag.toLowerCase()) ?? 0) + weight);
    }
    if (swipe.direction === 'right' && likedTitles.length < RECENT_SIGNAL_COUNT) likedTitles.push(recipe.title);
    if (swipe.direction === 'left' && passedTitles.length < RECENT_SIGNAL_COUNT) passedTitles.push(recipe.title);
  }

  return {
    cuisines,
    tags,
    likedTitles,
    passedTitles,
    swipedIds: swipes.map((swipe) => swipe.recipeId),
  };
}

function scoreRecipe(recipe, { preferences, profile, fridgeItems, dislikeMatches }) {
  let score = 0;

  const cuisine = (recipe.cuisine || '').toLowerCase();
  if (cuisine) {
    if ((preferences.favoriteCuisines || []).some((entry) => entry.toLowerCase() === cuisine)) score += 6;
    score += (profile.cuisines.get(cuisine) ?? 0) * 2;
  }

  for (const tag of recipe.dietaryTags || []) {
    score += (profile.tags.get(tag.toLowerCase()) ?? 0) * 1.2;
  }

  if (recipe.difficulty === preferences.preferredDifficulty) score += 3;

  const total = recipe.totalTime || recipe.prepTime + recipe.cookTime;
  if (total > 0) {
    const overrun = total - preferences.preferredCookingTime;
    score += overrun <= 0 ? 3 : Math.max(-6, -overrun / 12);
  }

  const favoriteHits = (preferences.favoriteIngredients || []).filter((favorite) =>
    (recipe.ingredients || []).some((item) =>
      item.name.toLowerCase().includes(favorite.toLowerCase())
    )
  ).length;
  score += Math.min(favoriteHits, 3) * 2.5;

  // Recipes the cook can mostly make right now rank higher.
  if (fridgeItems.length) {
    score += (fridgeCoverage(compareIngredients(recipe.ingredients, fridgeItems)) / 100) * 5;
  }

  const focus = preferences.nutritionGoals?.focus;
  const nutrition = recipe.nutrition || {};
  if (focus === 'high-protein' && nutrition.protein) score += Math.min(nutrition.protein / 10, 4);
  if (focus === 'low-carb' && nutrition.carbs !== null && nutrition.carbs !== undefined) {
    score += nutrition.carbs <= 40 ? 3 : -2;
  }
  if (focus === 'low-calorie' && nutrition.calories) score += nutrition.calories <= 550 ? 3 : -2;
  if (focus === 'plant-forward' && (recipe.dietaryTags || []).some((tag) => /vegan|vegetarian|plant/i.test(tag))) {
    score += 3;
  }

  score -= dislikeMatches.length * 4;

  // Slight freshness bias so newly generated recipes surface.
  const ageDays = (Date.now() - new Date(recipe.createdAt ?? Date.now())) / 86_400_000;
  score += Math.max(0, 2 - ageDays / 7);

  return score;
}

/**
 * Returns a ranked, constraint-safe feed. Existing recipes are reused first and
 * Gemini is only called when the pool cannot fill the request.
 */
export async function buildDiscoveryFeed({
  user,
  preferences,
  limit = 8,
  filters = {},
  allowGeneration = true,
}) {
  const [profile, fridgeItems, saved] = await Promise.all([
    buildTasteProfile(user._id),
    FridgeItem.find({ userId: user._id }).lean(),
    SavedRecipe.find({ userId: user._id }).select('recipeId').lean(),
  ]);

  const excludedIds = [...profile.swipedIds, ...saved.map((entry) => entry.recipeId)];

  const query = {
    $or: [{ userId: null }, { userId: user._id }],
    ...(excludedIds.length ? { _id: { $nin: excludedIds } } : {}),
    ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
    ...(filters.cuisine ? { cuisine: new RegExp(`^${escapeRegex(filters.cuisine)}$`, 'i') } : {}),
    ...(filters.maxTime ? { totalTime: { $gt: 0, $lte: filters.maxTime } } : {}),
  };

  const candidates = await Recipe.find(query).sort({ createdAt: -1 }).limit(CANDIDATE_POOL).lean();

  const constraints = {
    allergies: preferences.allergies || [],
    dietaryRestrictions: preferences.dietaryRestrictions || [],
    dislikes: preferences.dislikes || [],
  };

  const ranked = candidates
    .map((recipe) => {
      const check = checkRecipeAgainstUser(recipe, constraints);
      if (!check.safe) return null;
      return {
        recipe,
        score: scoreRecipe(recipe, {
          preferences,
          profile,
          fridgeItems,
          dislikeMatches: check.dislikeMatches,
        }),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  const feed = ranked.slice(0, limit).map((entry) => entry.recipe);
  let generated = 0;

  if (feed.length < limit && allowGeneration) {
    const fresh = await generateDiscoveryRecipes({
      preferences,
      fridgeItems,
      options: { ...filters, count: Math.min(limit - feed.length + 2, 8) },
      signals: {
        likedTitles: profile.likedTitles,
        passedTitles: profile.passedTitles,
        excludeTitles: [...candidates.slice(0, 20).map((recipe) => recipe.title), ...feed.map((r) => r.title)],
      },
    });

    const stored = await persistRecipes(fresh, { userId: user._id });
    const excludedSet = new Set(excludedIds.map(String));
    for (const recipe of stored) {
      if (excludedSet.has(recipe._id.toString())) continue;
      if (feed.some((existing) => existing._id.toString() === recipe._id.toString())) continue;
      feed.push(recipe.toObject());
      generated += 1;
      if (feed.length >= limit) break;
    }
  }

  return { recipes: feed, generated, poolSize: ranked.length };
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
