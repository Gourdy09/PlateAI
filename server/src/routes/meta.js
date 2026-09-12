import express from 'express';

import { asyncHandler } from '../middleware/auth.js';
import { FRIDGE_CATEGORIES } from '../models/FridgeItem.js';
import { THEME_MODES } from '../models/AppSettings.js';
import {
  BUDGETS,
  COOKING_SKILLS,
  DIFFICULTIES,
  MEAL_TYPES,
  UNIT_SYSTEMS,
} from '../models/UserPreferences.js';
import { SUPPORTED_ALLERGENS, SUPPORTED_DIETS } from '../services/recipes/safety.js';

export const metaRouter = express.Router();

/** Cuisines Plate offers as taste presets. */
const CUISINES = [
  'American', 'Cajun', 'Caribbean', 'Chinese', 'Ethiopian', 'Filipino', 'French',
  'Georgian', 'German', 'Greek', 'Indian', 'Indonesian', 'Italian', 'Japanese',
  'Korean', 'Lebanese', 'Malaysian', 'Mexican', 'Moroccan', 'Nigerian', 'Peruvian',
  'Persian', 'Polish', 'Portuguese', 'Spanish', 'Thai', 'Turkish', 'Vietnamese',
];

const NUTRITION_FOCUSES = [
  { value: 'balanced', label: 'Balanced' },
  { value: 'high-protein', label: 'High protein' },
  { value: 'low-carb', label: 'Lower carb' },
  { value: 'low-calorie', label: 'Lighter meals' },
  { value: 'plant-forward', label: 'Plant forward' },
  { value: 'performance', label: 'Training' },
];

function titleCase(value) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-');
}

/**
 * The option vocabulary the app renders. Served from the backend so the choices
 * the UI offers can never drift from what the models and safety rules accept.
 */
metaRouter.get(
  '/options',
  asyncHandler(async (_req, res) => {
    res.json({
      allergens: SUPPORTED_ALLERGENS.map((value) => ({ value, label: titleCase(value) })),
      diets: SUPPORTED_DIETS.map((value) => ({ value, label: titleCase(value) })),
      cuisines: CUISINES,
      mealTypes: MEAL_TYPES.map((value) => ({ value, label: titleCase(value) })),
      difficulties: DIFFICULTIES.map((value) => ({ value, label: titleCase(value) })),
      cookingSkills: COOKING_SKILLS.map((value) => ({ value, label: titleCase(value) })),
      budgets: BUDGETS.map((value) => ({ value, label: titleCase(value) })),
      unitSystems: UNIT_SYSTEMS.map((value) => ({ value, label: titleCase(value) })),
      fridgeCategories: FRIDGE_CATEGORIES.map((value) => ({ value, label: titleCase(value) })),
      nutritionFocuses: NUTRITION_FOCUSES,
      themes: THEME_MODES.map((value) => ({ value, label: titleCase(value) })),
    });
  })
);
