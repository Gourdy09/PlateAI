import type { ImageSourcePropType } from 'react-native';

export type SpiceLevel = 'Mild' | 'Medium' | 'Hot';

export type Dish = {
  id: string;
  name: string;
  summary: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  minutes: number;
  servings: number;
  rating: number;
  reviews: number;
  spice: SpiceLevel;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  tags: string[];
  ingredients: string[];
  steps: string[];
  image: ImageSourcePropType;
};

export const DISHES: Dish[] = [
  {
    id: 'quinoa',
    name: 'Avocado & Citrus Quinoa Salad',
    summary: 'Bright citrus, creamy avocado, and fluffy quinoa — a fresh lunch that still feels filling.',
    kcal: 320,
    protein: 9,
    carbs: 38,
    fat: 14,
    fiber: 8,
    sodium: 280,
    minutes: 15,
    servings: 2,
    rating: 4.7,
    reviews: 128,
    spice: 'Mild',
    difficulty: 'Easy',
    meal: 'Lunch',
    tags: ['High fiber', 'Vegetarian', 'Quick'],
    ingredients: [
      '1 cup cooked quinoa',
      '1 ripe avocado, sliced',
      '1 orange, segmented',
      '2 cups baby greens',
      '2 tbsp olive oil',
      '1 tbsp lemon juice',
      'Salt & cracked pepper',
    ],
    steps: [
      'Fluff cooled quinoa in a large bowl.',
      'Toss greens with olive oil and lemon.',
      'Layer quinoa, citrus, and avocado.',
      'Season and serve immediately.',
    ],
    image: require('@/assets/images/home/food-quinoa.jpeg'),
  },
  {
    id: 'quinoa-board',
    name: 'Herb Citrus Grain Bowl',
    summary: 'Roasted grains, herbs, and citrus zest with a soft egg on top for balanced energy.',
    kcal: 410,
    protein: 18,
    carbs: 44,
    fat: 16,
    fiber: 7,
    sodium: 340,
    minutes: 20,
    servings: 1,
    rating: 4.5,
    reviews: 86,
    spice: 'Mild',
    difficulty: 'Easy',
    meal: 'Lunch',
    tags: ['Balanced', 'Meal prep'],
    ingredients: [
      '1 cup cooked farro or quinoa',
      '1 soft-boiled egg',
      '1/2 cup roasted chickpeas',
      'Handful fresh herbs',
      'Citrus zest + juice',
      '2 tsp tahini',
    ],
    steps: [
      'Warm grains and chickpeas.',
      'Whisk tahini with citrus.',
      'Assemble bowl and top with egg.',
      'Finish with herbs and zest.',
    ],
    image: require('@/assets/images/home/food-quinoa-dark.jpeg'),
  },
  {
    id: 'mint-salad',
    name: 'Minted Avocado Salad',
    summary: 'Cool mint, lime, and avocado for a snappy side or light dinner.',
    kcal: 280,
    protein: 8,
    carbs: 22,
    fat: 18,
    fiber: 9,
    sodium: 190,
    minutes: 12,
    servings: 2,
    rating: 4.4,
    reviews: 64,
    spice: 'Mild',
    difficulty: 'Easy',
    meal: 'Dinner',
    tags: ['Plant-based', 'Low carb'],
    ingredients: [
      '2 avocados',
      '1 cucumber, shaved',
      '1/4 cup fresh mint',
      'Juice of 1 lime',
      'Chili flakes (optional)',
      'Olive oil drizzle',
    ],
    steps: [
      'Slice avocado and cucumber.',
      'Toss with mint and lime.',
      'Add oil and chili to taste.',
      'Serve chilled.',
    ],
    image: require('@/assets/images/home/food-quinoa-alt.png'),
  },
  {
    id: 'protein-bowl',
    name: 'High-Protein Lunch Plate',
    summary: 'Lean protein, roasted veg, and a herby yogurt sauce built for recovery days.',
    kcal: 520,
    protein: 32,
    carbs: 41,
    fat: 22,
    fiber: 6,
    sodium: 480,
    minutes: 25,
    servings: 1,
    rating: 4.8,
    reviews: 210,
    spice: 'Medium',
    difficulty: 'Medium',
    meal: 'Lunch',
    tags: ['High protein', 'Weight loss'],
    ingredients: [
      '6 oz grilled chicken or tofu',
      '1 cup roasted sweet potato',
      '1 cup broccoli florets',
      '1/3 cup Greek yogurt sauce',
      '1 tsp smoked paprika',
      'Olive oil, salt, pepper',
    ],
    steps: [
      'Season and cook protein.',
      'Roast sweet potato and broccoli.',
      'Stir yogurt sauce with paprika.',
      'Plate and drizzle sauce.',
    ],
    image: require('@/assets/images/home/food-quinoa-dark-alt.png'),
  },
];

export function getDish(id: string) {
  return DISHES.find((dish) => dish.id === id) ?? DISHES[0];
}
