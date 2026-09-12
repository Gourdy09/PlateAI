import { unprocessable } from '../../lib/errors.js';

/**
 * Ingredient-level constraint checking.
 *
 * Gemini is prompted with the user's allergies, but a prompt is not a guarantee,
 * so every recipe is re-checked here before it can be stored or returned. Matching
 * removes known-safe phrases first ("coconut milk", "butternut squash", "eggplant")
 * so that substring collisions do not produce false allergy hits.
 */

const ALLERGEN_GROUPS = {
  peanuts: {
    label: 'Peanuts',
    terms: ['peanut', 'peanuts', 'peanut butter', 'peanut oil', 'groundnut', 'satay'],
    safePhrases: ['peanut free'],
  },
  'tree nuts': {
    label: 'Tree nuts',
    terms: [
      'almond', 'almonds', 'walnut', 'walnuts', 'cashew', 'cashews', 'pecan', 'pecans',
      'hazelnut', 'hazelnuts', 'pistachio', 'pistachios', 'macadamia', 'brazil nut',
      'pine nut', 'pine nuts', 'chestnut', 'praline', 'marzipan', 'frangipane', 'nutella',
      'tree nut', 'tree nuts', 'mixed nuts', 'nut butter',
    ],
    safePhrases: ['nut free', 'nutmeg', 'water chestnut', 'coconut', 'butternut', 'nutritional yeast'],
  },
  dairy: {
    label: 'Dairy',
    terms: [
      'milk', 'butter', 'buttermilk', 'cheese', 'parmesan', 'mozzarella', 'cheddar', 'feta',
      'ricotta', 'mascarpone', 'gruyere', 'provolone', 'yogurt', 'yoghurt', 'cream',
      'heavy cream', 'sour cream', 'creme fraiche', 'half and half', 'ghee', 'custard',
      'ice cream', 'whey', 'casein', 'condensed milk', 'evaporated milk', 'dairy',
    ],
    safePhrases: [
      'coconut milk', 'almond milk', 'oat milk', 'soy milk', 'rice milk', 'cashew milk',
      'hemp milk', 'pea milk', 'milk thistle', 'coconut cream', 'cashew cream',
      'cream of tartar', 'peanut butter', 'almond butter', 'cashew butter', 'nut butter',
      'sunflower butter', 'cocoa butter', 'apple butter', 'vegan butter', 'plant butter',
      'butternut', 'butter lettuce', 'butterhead', 'butterfly', 'butternut squash',
      'vegan cheese', 'nutritional yeast', 'dairy free', 'non dairy', 'coconut yogurt',
      'coconut yoghurt', 'creamy', 'buttercup squash',
    ],
  },
  eggs: {
    label: 'Eggs',
    terms: ['egg', 'eggs', 'egg white', 'egg yolk', 'mayonnaise', 'mayo', 'meringue', 'aioli', 'albumen'],
    safePhrases: ['eggplant', 'egg free', 'eggless', 'vegan mayo', 'vegan mayonnaise', 'flax egg', 'chia egg'],
  },
  gluten: {
    label: 'Gluten',
    terms: [
      'wheat', 'flour', 'all purpose flour', 'bread', 'breadcrumbs', 'panko', 'pasta',
      'spaghetti', 'penne', 'macaroni', 'noodles', 'barley', 'rye', 'semolina', 'farro',
      'spelt', 'couscous', 'bulgur', 'orzo', 'seitan', 'phyllo', 'puff pastry',
      'tortilla', 'pita', 'naan', 'cracker', 'crackers', 'soy sauce', 'gluten',
    ],
    safePhrases: [
      'gluten free', 'almond flour', 'coconut flour', 'rice flour', 'chickpea flour',
      'corn flour', 'cornflour', 'cassava flour', 'tapioca flour', 'oat flour',
      'buckwheat flour', 'quinoa flour', 'cornstarch', 'rice noodles', 'glass noodles',
      'corn tortilla', 'tamari', 'coconut aminos', 'rice paper', 'wheatgrass',
    ],
  },
  shellfish: {
    label: 'Shellfish',
    terms: [
      'shrimp', 'prawn', 'prawns', 'crab', 'lobster', 'crayfish', 'langoustine', 'scallop',
      'scallops', 'clam', 'clams', 'mussel', 'mussels', 'oyster', 'oysters', 'squid',
      'calamari', 'octopus', 'shellfish', 'crawfish', 'oyster sauce',
    ],
    safePhrases: ['shellfish free', 'mushroom', 'oyster mushroom'],
  },
  fish: {
    label: 'Fish',
    terms: [
      'salmon', 'tuna', 'cod', 'halibut', 'anchovy', 'anchovies', 'sardine', 'sardines',
      'tilapia', 'trout', 'sea bass', 'snapper', 'mackerel', 'haddock', 'mahi mahi',
      'swordfish', 'fish sauce', 'fish stock', 'worcestershire', 'bonito', 'dashi', 'fish',
    ],
    safePhrases: ['fish free', 'shellfish', 'vegan fish sauce', 'crayfish', 'crawfish'],
  },
  soy: {
    label: 'Soy',
    terms: [
      'soy', 'soya', 'soybean', 'soy sauce', 'tofu', 'tempeh', 'edamame', 'miso',
      'tamari', 'soy lecithin', 'textured vegetable protein',
    ],
    safePhrases: ['soy free', 'coconut aminos'],
  },
  sesame: {
    label: 'Sesame',
    terms: ['sesame', 'tahini', 'halva', 'za atar', 'zaatar', 'sesame oil', 'gomashio'],
    safePhrases: ['sesame free'],
  },
  mustard: {
    label: 'Mustard',
    terms: ['mustard', 'dijon', 'mustard seed', 'wholegrain mustard'],
    safePhrases: ['mustard free', 'mustard greens'],
  },
  celery: {
    label: 'Celery',
    terms: ['celery', 'celeriac', 'celery salt', 'celery seed'],
    safePhrases: ['celery free'],
  },
  sulfites: {
    label: 'Sulfites',
    terms: ['sulfite', 'sulphite', 'sulfites', 'sulphites', 'wine', 'dried apricot'],
    safePhrases: ['sulfite free', 'wine vinegar', 'rice wine vinegar'],
  },
};

const MEAT_TERMS = [
  'beef', 'steak', 'sirloin', 'ribeye', 'brisket', 'ground beef', 'veal', 'pork',
  'bacon', 'pancetta', 'prosciutto', 'ham', 'sausage', 'chorizo', 'salami',
  'pepperoni', 'lamb', 'mutton', 'goat', 'venison', 'bison', 'lard', 'tallow',
  'gelatin', 'gelatine', 'oxtail', 'short rib', 'pastrami', 'guanciale',
];

const POULTRY_TERMS = [
  'chicken', 'turkey', 'duck', 'goose', 'quail', 'poultry', 'chicken stock',
  'chicken broth', 'chicken thigh', 'chicken breast',
];

const PORK_TERMS = ['pork', 'bacon', 'pancetta', 'prosciutto', 'ham', 'lard', 'guanciale', 'chorizo'];

const ANIMAL_SAFE_PHRASES = [
  'vegan', 'vegetarian', 'plant based', 'meat free', 'beef free', 'chicken free',
  'mushroom', 'jackfruit', 'beefsteak tomato', 'chicken of the woods',
  'vegetable stock', 'vegetable broth', 'chicken style seasoning', 'soy chorizo',
  'coconut bacon', 'agar', 'beyond meat', 'impossible',
];

/**
 * Structural diets are enforced as hard constraints. Dietary styles that are
 * about ratios rather than forbidden ingredients (keto, paleo, low carb) are
 * treated as preferences and steer generation instead of blocking it.
 */
const DIET_RULES = {
  vegan: {
    label: 'Vegan',
    terms: [
      ...MEAT_TERMS, ...POULTRY_TERMS,
      ...ALLERGEN_GROUPS.fish.terms, ...ALLERGEN_GROUPS.shellfish.terms,
      ...ALLERGEN_GROUPS.dairy.terms, ...ALLERGEN_GROUPS.eggs.terms,
      'honey',
    ],
    safePhrases: [
      ...ANIMAL_SAFE_PHRASES,
      ...ALLERGEN_GROUPS.dairy.safePhrases,
      ...ALLERGEN_GROUPS.eggs.safePhrases,
    ],
  },
  vegetarian: {
    label: 'Vegetarian',
    terms: [
      ...MEAT_TERMS, ...POULTRY_TERMS,
      ...ALLERGEN_GROUPS.fish.terms, ...ALLERGEN_GROUPS.shellfish.terms,
    ],
    safePhrases: ANIMAL_SAFE_PHRASES,
  },
  pescatarian: {
    label: 'Pescatarian',
    terms: [...MEAT_TERMS, ...POULTRY_TERMS],
    safePhrases: ANIMAL_SAFE_PHRASES,
  },
  halal: {
    label: 'Halal',
    terms: [...PORK_TERMS, 'gelatin', 'gelatine', 'wine', 'beer', 'rum', 'vodka', 'brandy', 'bourbon', 'sake', 'mirin'],
    safePhrases: ['halal', 'wine vinegar', 'rice wine vinegar', 'apple cider vinegar', 'beef gelatin free'],
  },
  kosher: {
    label: 'Kosher',
    terms: [...PORK_TERMS, ...ALLERGEN_GROUPS.shellfish.terms, 'rabbit'],
    safePhrases: ['kosher', 'kosher salt', 'mushroom', 'oyster mushroom'],
  },
  'gluten-free': { label: 'Gluten-free', ...ALLERGEN_GROUPS.gluten },
  'dairy-free': { label: 'Dairy-free', ...ALLERGEN_GROUPS.dairy },
  'nut-free': {
    label: 'Nut-free',
    terms: [...ALLERGEN_GROUPS.peanuts.terms, ...ALLERGEN_GROUPS['tree nuts'].terms],
    safePhrases: [...ALLERGEN_GROUPS.peanuts.safePhrases, ...ALLERGEN_GROUPS['tree nuts'].safePhrases],
  },
  'egg-free': { label: 'Egg-free', ...ALLERGEN_GROUPS.eggs },
  'soy-free': { label: 'Soy-free', ...ALLERGEN_GROUPS.soy },
  'shellfish-free': { label: 'Shellfish-free', ...ALLERGEN_GROUPS.shellfish },
  'pork-free': {
    label: 'Pork-free',
    terms: PORK_TERMS,
    safePhrases: ['pork free', ...ANIMAL_SAFE_PHRASES],
  },
};

/** Diet names we accept but that do not block a recipe. */
const ADVISORY_DIETS = new Set([
  'keto', 'ketogenic', 'paleo', 'low-carb', 'low carb', 'whole30', 'mediterranean',
  'low-sodium', 'low sodium', 'high-protein', 'high protein', 'diabetic-friendly',
]);

export const SUPPORTED_ALLERGENS = Object.keys(ALLERGEN_GROUPS);
export const SUPPORTED_DIETS = Object.keys(DIET_RULES);

function normalize(text) {
  return ` ${String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `;
}

function stripSafePhrases(haystack, safePhrases = []) {
  let result = haystack;
  // "X free" claims and "gluten free bread" style phrases must go before terms.
  result = result.replace(/\b(gluten|dairy|nut|egg|soy|sesame|peanut|shellfish|fish|meat)\s+free\s+\w+(\s+\w+)?/g, ' ');
  const ordered = [...safePhrases].sort((a, b) => b.length - a.length);
  for (const phrase of ordered) {
    const needle = normalize(phrase).trim();
    if (!needle) continue;
    result = result.split(` ${needle} `).join('  ');
    // Also handle the phrase at a boundary created by a previous replacement.
    while (result.includes(` ${needle} `)) result = result.split(` ${needle} `).join('  ');
  }
  return result;
}

function findTerms(haystack, { terms = [], safePhrases = [] }) {
  const cleaned = stripSafePhrases(haystack, safePhrases);
  const hits = new Set();
  for (const term of terms) {
    const needle = normalize(term).trim();
    if (!needle) continue;
    if (cleaned.includes(` ${needle} `)) hits.add(term);
  }
  return [...hits];
}

/** All text a constraint check should look at. */
function recipeHaystack(recipe) {
  return normalize(
    [
      recipe.title,
      recipe.description,
      ...(recipe.ingredients || []).map((item) =>
        typeof item === 'string' ? item : [item?.name, item?.note].filter(Boolean).join(' ')
      ),
      ...(recipe.instructions || []),
    ]
      .filter(Boolean)
      .join(' . ')
  );
}

function resolveAllergenKey(allergy) {
  const key = String(allergy || '').toLowerCase().trim();
  if (ALLERGEN_GROUPS[key]) return key;
  const singular = key.replace(/s$/, '');
  const match = SUPPORTED_ALLERGENS.find(
    (name) => name === singular || name.replace(/s$/, '') === singular
  );
  return match ?? null;
}

/**
 * @returns {{ allergy: string, label: string, matches: string[] }[]} one entry per violated allergy
 */
export function findAllergyViolations(recipe, allergies = []) {
  const haystack = recipeHaystack(recipe);
  const violations = [];

  for (const allergy of allergies) {
    const key = resolveAllergenKey(allergy);
    const group = key
      ? ALLERGEN_GROUPS[key]
      : { label: allergy, terms: [String(allergy)], safePhrases: [] };
    const matches = findTerms(haystack, group);
    if (matches.length) {
      violations.push({ allergy, label: group.label || allergy, matches });
    }
  }
  return violations;
}

export function findDietViolations(recipe, dietaryRestrictions = []) {
  const haystack = recipeHaystack(recipe);
  const violations = [];

  for (const diet of dietaryRestrictions) {
    const key = String(diet || '').toLowerCase().trim();
    if (ADVISORY_DIETS.has(key)) continue;
    const rule = DIET_RULES[key];
    if (!rule) continue;
    const matches = findTerms(haystack, rule);
    if (matches.length) violations.push({ diet, label: rule.label, matches });
  }
  return violations;
}

/** Disliked ingredients are soft: reported, never a blocker. */
export function findDislikeMatches(recipe, dislikes = []) {
  const haystack = recipeHaystack(recipe);
  return dislikes.filter((dislike) => {
    const needle = normalize(dislike).trim();
    return Boolean(needle) && haystack.includes(` ${needle} `);
  });
}

/** Allergens Plate can detect in a recipe, stored on the Recipe document. */
export function detectAllergens(recipe) {
  const haystack = recipeHaystack(recipe);
  return SUPPORTED_ALLERGENS.filter((key) => findTerms(haystack, ALLERGEN_GROUPS[key]).length).map(
    (key) => ALLERGEN_GROUPS[key].label
  );
}

export function checkRecipeAgainstUser(recipe, { allergies = [], dietaryRestrictions = [], dislikes = [] } = {}) {
  const allergyViolations = findAllergyViolations(recipe, allergies);
  const dietViolations = findDietViolations(recipe, dietaryRestrictions);
  return {
    safe: allergyViolations.length === 0 && dietViolations.length === 0,
    allergyViolations,
    dietViolations,
    dislikeMatches: findDislikeMatches(recipe, dislikes),
  };
}

/** Throws when a recipe breaks a hard constraint. Never bypassed for AI output. */
export function assertRecipeIsSafe(recipe, constraints) {
  const result = checkRecipeAgainstUser(recipe, constraints);
  if (result.safe) return result;

  const reasons = [
    ...result.allergyViolations.map((item) => item.label),
    ...result.dietViolations.map((item) => item.label),
  ];
  throw unprocessable(
    `Plate blocked a recipe that conflicted with your ${reasons.join(' and ')} settings. Try again.`,
    {
      internalMessage: `Blocked recipe "${recipe.title}": ${JSON.stringify({
        allergies: result.allergyViolations,
        diets: result.dietViolations,
      })}`,
      details: { allergyViolations: result.allergyViolations, dietViolations: result.dietViolations },
    }
  );
}
