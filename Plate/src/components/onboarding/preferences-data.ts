/**
 * Static catalog for the preferences onboarding flow.
 * Diets and ingredients here drive the onboarding UI; ingredient options in
 * later steps are filtered by the diet the user picks in step one.
 */

export type Restriction =
  | 'meat'
  | 'poultry'
  | 'fish'
  | 'shellfish'
  | 'dairy'
  | 'egg'
  | 'grain'
  | 'gluten'
  | 'highcarb';

export type DietId =
  | 'anything'
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'keto'
  | 'paleo'
  | 'mediterranean'
  | 'flexitarian'
  | 'lowcarb'
  | 'glutenfree'
  | 'dairyfree';

export type Diet = {
  id: DietId;
  label: string;
  description: string;
  /** Ingredient tags that this diet excludes from later steps. */
  excludes: Restriction[];
};

export const DIETS: Diet[] = [
  {
    id: 'anything',
    label: 'No restrictions',
    description: 'A bit of everything — nothing off the table.',
    excludes: [],
  },
  {
    id: 'vegetarian',
    label: 'Vegetarian',
    description: 'No meat, poultry, or seafood.',
    excludes: ['meat', 'poultry', 'fish', 'shellfish'],
  },
  {
    id: 'vegan',
    label: 'Vegan',
    description: 'No animal products at all.',
    excludes: ['meat', 'poultry', 'fish', 'shellfish', 'dairy', 'egg'],
  },
  {
    id: 'pescatarian',
    label: 'Pescatarian',
    description: 'Vegetarian, plus fish and seafood.',
    excludes: ['meat', 'poultry'],
  },
  {
    id: 'keto',
    label: 'Keto',
    description: 'Very low carb, higher fat.',
    excludes: ['grain', 'highcarb'],
  },
  {
    id: 'paleo',
    label: 'Paleo',
    description: 'Whole foods — no grains or dairy.',
    excludes: ['grain', 'gluten', 'dairy'],
  },
  {
    id: 'mediterranean',
    label: 'Mediterranean',
    description: 'Veggies, olive oil, seafood, whole grains.',
    excludes: [],
  },
  {
    id: 'flexitarian',
    label: 'Flexitarian',
    description: 'Mostly plant-based, occasionally meat.',
    excludes: [],
  },
  {
    id: 'lowcarb',
    label: 'Low-carb',
    description: 'Fewer carbs, more protein and veg.',
    excludes: ['grain', 'highcarb'],
  },
  {
    id: 'glutenfree',
    label: 'Gluten-free',
    description: 'No wheat, barley, or rye.',
    excludes: ['gluten'],
  },
  {
    id: 'dairyfree',
    label: 'Dairy-free',
    description: 'No milk, cheese, or butter.',
    excludes: ['dairy'],
  },
];

export type IngredientCategory =
  | 'Proteins'
  | 'Vegetables'
  | 'Fruits'
  | 'Grains & Carbs'
  | 'Dairy & Eggs'
  | 'Pantry';

export const INGREDIENT_CATEGORIES: IngredientCategory[] = [
  'Proteins',
  'Vegetables',
  'Fruits',
  'Grains & Carbs',
  'Dairy & Eggs',
  'Pantry',
];

export type Ingredient = {
  name: string;
  category: IngredientCategory;
  tags: Restriction[];
};

export const INGREDIENTS: Ingredient[] = [
  // Proteins
  { name: 'Chicken', category: 'Proteins', tags: ['poultry'] },
  { name: 'Turkey', category: 'Proteins', tags: ['poultry'] },
  { name: 'Beef', category: 'Proteins', tags: ['meat'] },
  { name: 'Pork', category: 'Proteins', tags: ['meat'] },
  { name: 'Salmon', category: 'Proteins', tags: ['fish'] },
  { name: 'Tuna', category: 'Proteins', tags: ['fish'] },
  { name: 'Shrimp', category: 'Proteins', tags: ['shellfish'] },
  { name: 'Tofu', category: 'Proteins', tags: [] },
  { name: 'Tempeh', category: 'Proteins', tags: [] },
  { name: 'Chickpeas', category: 'Proteins', tags: [] },
  { name: 'Black beans', category: 'Proteins', tags: [] },
  { name: 'Lentils', category: 'Proteins', tags: [] },

  // Vegetables
  { name: 'Spinach', category: 'Vegetables', tags: [] },
  { name: 'Broccoli', category: 'Vegetables', tags: [] },
  { name: 'Carrots', category: 'Vegetables', tags: [] },
  { name: 'Bell peppers', category: 'Vegetables', tags: [] },
  { name: 'Tomatoes', category: 'Vegetables', tags: [] },
  { name: 'Onions', category: 'Vegetables', tags: [] },
  { name: 'Garlic', category: 'Vegetables', tags: [] },
  { name: 'Zucchini', category: 'Vegetables', tags: [] },
  { name: 'Cauliflower', category: 'Vegetables', tags: [] },
  { name: 'Mushrooms', category: 'Vegetables', tags: [] },
  { name: 'Kale', category: 'Vegetables', tags: [] },
  { name: 'Avocado', category: 'Vegetables', tags: [] },
  { name: 'Sweet potato', category: 'Vegetables', tags: ['highcarb'] },

  // Fruits
  { name: 'Apples', category: 'Fruits', tags: [] },
  { name: 'Bananas', category: 'Fruits', tags: ['highcarb'] },
  { name: 'Berries', category: 'Fruits', tags: [] },
  { name: 'Oranges', category: 'Fruits', tags: [] },
  { name: 'Lemons', category: 'Fruits', tags: [] },
  { name: 'Mango', category: 'Fruits', tags: ['highcarb'] },
  { name: 'Grapes', category: 'Fruits', tags: ['highcarb'] },

  // Grains & Carbs
  { name: 'Rice', category: 'Grains & Carbs', tags: ['grain', 'highcarb'] },
  { name: 'Pasta', category: 'Grains & Carbs', tags: ['grain', 'gluten', 'highcarb'] },
  { name: 'Bread', category: 'Grains & Carbs', tags: ['grain', 'gluten', 'highcarb'] },
  { name: 'Quinoa', category: 'Grains & Carbs', tags: ['grain', 'highcarb'] },
  { name: 'Oats', category: 'Grains & Carbs', tags: ['grain', 'highcarb'] },
  { name: 'Tortillas', category: 'Grains & Carbs', tags: ['grain', 'highcarb'] },
  { name: 'Potatoes', category: 'Grains & Carbs', tags: ['highcarb'] },
  { name: 'Couscous', category: 'Grains & Carbs', tags: ['grain', 'gluten', 'highcarb'] },

  // Dairy & Eggs
  { name: 'Milk', category: 'Dairy & Eggs', tags: ['dairy'] },
  { name: 'Cheese', category: 'Dairy & Eggs', tags: ['dairy'] },
  { name: 'Yogurt', category: 'Dairy & Eggs', tags: ['dairy'] },
  { name: 'Butter', category: 'Dairy & Eggs', tags: ['dairy'] },
  { name: 'Eggs', category: 'Dairy & Eggs', tags: ['egg'] },

  // Pantry
  { name: 'Olive oil', category: 'Pantry', tags: [] },
  { name: 'Peanut butter', category: 'Pantry', tags: [] },
  { name: 'Almonds', category: 'Pantry', tags: [] },
  { name: 'Canned tomatoes', category: 'Pantry', tags: [] },
  { name: 'Soy sauce', category: 'Pantry', tags: ['gluten'] },
  { name: 'Honey', category: 'Pantry', tags: [] },
  { name: 'Flour', category: 'Pantry', tags: ['grain', 'gluten', 'highcarb'] },
];

export function getDiet(id: DietId | null): Diet | undefined {
  return DIETS.find((diet) => diet.id === id);
}

/** Ingredients compatible with the chosen diet, grouped by category (order preserved). */
export function ingredientsForDiet(
  dietId: DietId | null
): { category: IngredientCategory; items: Ingredient[] }[] {
  const excluded = new Set(getDiet(dietId)?.excludes ?? []);
  return INGREDIENT_CATEGORIES.map((category) => ({
    category,
    items: INGREDIENTS.filter(
      (ingredient) =>
        ingredient.category === category &&
        !ingredient.tags.some((tag) => excluded.has(tag))
    ),
  })).filter((group) => group.items.length > 0);
}

export type FoodPreferences = {
  diet: DietId;
  /** Free-text extras the presets do not cover, e.g. "can't eat eggs". */
  dietNotes?: string;
  ingredientsOnHand: string[];
  ingredientsWillingToBuy: string[];
};
