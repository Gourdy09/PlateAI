import type { ImageSourcePropType } from 'react-native';

export type Dish = {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  minutes: number;
  image: ImageSourcePropType;
};

export const DISHES: Dish[] = [
  {
    id: 'quinoa',
    name: 'Avocado & Citrus Quinoa Salad',
    kcal: 320,
    protein: 9,
    carbs: 38,
    fat: 14,
    minutes: 15,
    image: require('@/assets/images/home/food-quinoa.jpeg'),
  },
  {
    id: 'quinoa-board',
    name: 'Herb Citrus Grain Bowl',
    kcal: 410,
    protein: 18,
    carbs: 44,
    fat: 16,
    minutes: 20,
    image: require('@/assets/images/home/food-quinoa-dark.jpeg'),
  },
  {
    id: 'mint-salad',
    name: 'Minted Avocado Salad',
    kcal: 280,
    protein: 8,
    carbs: 22,
    fat: 18,
    minutes: 12,
    image: require('@/assets/images/home/food-quinoa-alt.png'),
  },
  {
    id: 'protein-bowl',
    name: 'High-Protein Lunch Plate',
    kcal: 520,
    protein: 32,
    carbs: 41,
    fat: 22,
    minutes: 25,
    image: require('@/assets/images/home/food-quinoa-dark-alt.png'),
  },
];

export function getDish(id: string) {
  return DISHES.find((dish) => dish.id === id) ?? DISHES[0];
}
