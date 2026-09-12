/** Quantity/unit parsing shared by the cart and the fridge comparison. */

const UNIT_ALIASES = {
  teaspoon: 'tsp', teaspoons: 'tsp', tsp: 'tsp', tsps: 'tsp',
  tablespoon: 'tbsp', tablespoons: 'tbsp', tbsp: 'tbsp', tbsps: 'tbsp', tbs: 'tbsp',
  cup: 'cup', cups: 'cup',
  ounce: 'oz', ounces: 'oz', oz: 'oz',
  pound: 'lb', pounds: 'lb', lb: 'lb', lbs: 'lb',
  gram: 'g', grams: 'g', g: 'g',
  kilogram: 'kg', kilograms: 'kg', kg: 'kg',
  milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', ml: 'ml',
  liter: 'l', liters: 'l', litre: 'l', l: 'l',
  pint: 'pint', pints: 'pint',
  quart: 'quart', quarts: 'quart',
  gallon: 'gallon', gallons: 'gallon',
  clove: 'clove', cloves: 'clove',
  slice: 'slice', slices: 'slice',
  can: 'can', cans: 'can',
  jar: 'jar', jars: 'jar',
  package: 'package', packages: 'package', pkg: 'package',
  bunch: 'bunch', bunches: 'bunch',
  head: 'head', heads: 'head',
  sprig: 'sprig', sprigs: 'sprig',
  stalk: 'stalk', stalks: 'stalk',
  pinch: 'pinch', pinches: 'pinch',
  dash: 'dash', dashes: 'dash',
  piece: 'piece', pieces: 'piece',
  fillet: 'fillet', fillets: 'fillet',
};

const VULGAR_FRACTIONS = {
  '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 0.25, '¾': 0.75,
  '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8, '⅙': 1 / 6, '⅚': 5 / 6,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
};

export function normalizeUnit(unit) {
  const key = String(unit || '').toLowerCase().replace(/[.\s]+/g, '');
  return UNIT_ALIASES[key] ?? String(unit || '').toLowerCase().trim();
}

/** Parses "1 1/2", "2½", ".5", "2-3" (takes the upper bound). Returns null if not numeric. */
export function parseAmount(quantity) {
  const raw = String(quantity ?? '').trim();
  if (!raw) return null;

  let text = raw;
  for (const [glyph, value] of Object.entries(VULGAR_FRACTIONS)) {
    text = text.replace(new RegExp(glyph, 'g'), ` ${value} `);
  }
  // Ranges: "2-3 cups" -> use the larger amount so shopping never falls short.
  const range = text.match(/^\s*(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)/);
  if (range) return Number.parseFloat(range[2]);

  const tokens = text.match(/\d+\s*\/\s*\d+|\d+(?:\.\d+)?|\.\d+/g);
  if (!tokens?.length) return null;

  let total = 0;
  for (const token of tokens) {
    if (token.includes('/')) {
      const [numerator, denominator] = token.split('/').map((part) => Number.parseFloat(part));
      if (denominator) total += numerator / denominator;
    } else {
      total += Number.parseFloat(token);
    }
  }
  return Number.isFinite(total) && total > 0 ? total : null;
}

function formatAmount(amount) {
  if (!Number.isFinite(amount)) return '';
  const rounded = Math.round(amount * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  const fractions = [
    [0.25, '1/4'], [1 / 3, '1/3'], [0.5, '1/2'], [2 / 3, '2/3'], [0.75, '3/4'],
  ];
  const whole = Math.floor(rounded);
  const remainder = rounded - whole;
  const match = fractions.find(([value]) => Math.abs(value - remainder) < 0.02);
  if (match) return whole ? `${whole} ${match[1]}` : match[1];
  return String(rounded);
}

/**
 * Adds two quantities when their units agree. Returns null when the amounts are
 * not comparable, so callers can keep both entries instead of inventing a total.
 */
export function combineQuantities(a, b) {
  const unitA = normalizeUnit(a.unit);
  const unitB = normalizeUnit(b.unit);
  if (unitA !== unitB) return null;

  const amountA = parseAmount(a.quantity);
  const amountB = parseAmount(b.quantity);
  if (amountA === null || amountB === null) return null;

  return { quantity: formatAmount(amountA + amountB), unit: unitA };
}

const DESCRIPTORS = new Set([
  'fresh', 'freshly', 'frozen', 'dried', 'chopped', 'diced', 'minced', 'sliced',
  'shredded', 'grated', 'crushed', 'ground', 'cooked', 'uncooked', 'raw', 'ripe',
  'large', 'medium', 'small', 'extra', 'boneless', 'skinless', 'lean', 'organic',
  'low', 'fat', 'reduced', 'unsalted', 'salted', 'plain', 'whole', 'halved',
  'peeled', 'seeded', 'stemmed', 'trimmed', 'rinsed', 'drained', 'packed', 'thinly',
  'roughly', 'finely', 'coarsely', 'optional', 'divided', 'to', 'taste', 'and',
  'or', 'of', 'for', 'the', 'a', 'an', 'plus', 'more', 'about', 'roasted', 'toasted',
  'room', 'temperature', 'softened', 'melted', 'cut', 'into', 'inch', 'pieces',
  'lengthwise', 'crosswise', 'preferably', 'good', 'quality', 'best',
]);

const IRREGULAR_SINGULARS = {
  leaves: 'leaf', tomatoes: 'tomato', potatoes: 'potato', berries: 'berry',
  loaves: 'loaf', halves: 'half', knives: 'knife', chilies: 'chili', chillies: 'chili',
};

function singularize(word) {
  if (IRREGULAR_SINGULARS[word]) return IRREGULAR_SINGULARS[word];
  if (word.length > 3 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && word.endsWith('es') && !word.endsWith('ses')) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

/**
 * Reduces "2 large boneless, skinless chicken breasts (about 1 lb)" to
 * "chicken breast" so fridge items and recipe lines can be compared.
 */
export function canonicalIngredientName(name) {
  const base = String(name || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !UNIT_ALIASES[word])
    .filter((word) => !DESCRIPTORS.has(word))
    .map(singularize)
    .filter((word) => word.length > 1);

  return base.join(' ').trim();
}

export function ingredientTokens(name) {
  return new Set(canonicalIngredientName(name).split(' ').filter(Boolean));
}
