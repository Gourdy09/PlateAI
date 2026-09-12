import { canonicalIngredientName, ingredientTokens } from './units.js';

/** Words too generic to justify a match on their own. */
const WEAK_TOKENS = new Set([
  'oil', 'salt', 'pepper', 'sauce', 'stock', 'broth', 'powder', 'seed', 'juice',
  'paste', 'flake', 'sugar', 'vinegar', 'water', 'leaf', 'sprig', 'clove', 'bean',
]);

function isMatch(recipeName, fridgeName) {
  const recipeCanonical = canonicalIngredientName(recipeName);
  const fridgeCanonical = canonicalIngredientName(fridgeName);
  if (!recipeCanonical || !fridgeCanonical) return false;
  if (recipeCanonical === fridgeCanonical) return true;

  // "chicken breast" in the recipe is covered by "chicken" in the fridge.
  if (recipeCanonical.includes(fridgeCanonical) || fridgeCanonical.includes(recipeCanonical)) {
    const shorter = recipeCanonical.length < fridgeCanonical.length ? recipeCanonical : fridgeCanonical;
    return !WEAK_TOKENS.has(shorter);
  }

  const recipeSet = ingredientTokens(recipeName);
  const fridgeSet = ingredientTokens(fridgeName);
  const shared = [...fridgeSet].filter((token) => recipeSet.has(token) && !WEAK_TOKENS.has(token));
  if (!shared.length) return false;

  // Require the overlap to cover most of the shorter name to avoid
  // "olive oil" matching "olive tapenade" on one weak token.
  const smaller = Math.min(recipeSet.size, fridgeSet.size);
  return shared.length / smaller >= 0.5;
}

/**
 * Compares a recipe's ingredient list against the user's fridge.
 *
 * @returns {{ have: object[], missing: object[], optional: object[] }}
 */
export function compareIngredients(recipeIngredients = [], fridgeItems = []) {
  const have = [];
  const missing = [];
  const optional = [];

  for (const ingredient of recipeIngredients) {
    const name = typeof ingredient === 'string' ? ingredient : ingredient?.name;
    if (!name) continue;

    const source = typeof ingredient === 'string' ? { name } : ingredient;
    const match = fridgeItems.find((item) => isMatch(name, item.name));

    const entry = {
      name: source.name,
      quantity: source.quantity || '',
      unit: source.unit || '',
      optional: Boolean(source.optional),
      note: source.note || '',
      matchedFridgeItem: match
        ? {
            id: match._id ? match._id.toString() : match.id,
            name: match.name,
            quantity: match.quantity || '',
            unit: match.unit || '',
          }
        : null,
    };

    if (match) have.push(entry);
    else if (entry.optional) optional.push(entry);
    else missing.push(entry);
  }

  return { have, missing, optional };
}

export function fridgeCoverage(comparison) {
  const total = comparison.have.length + comparison.missing.length;
  if (!total) return 0;
  return Math.round((comparison.have.length / total) * 100);
}
