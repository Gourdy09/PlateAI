import mongoose from 'mongoose';

export const COOKING_SKILLS = ['beginner', 'intermediate', 'advanced'];
export const DIFFICULTIES = ['easy', 'medium', 'hard'];
export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];
export const BUDGETS = ['budget', 'moderate', 'premium'];
export const UNIT_SYSTEMS = ['imperial', 'metric'];

const stringList = (max = 40) => ({
  type: [{ type: String, trim: true, maxlength: 60 }],
  default: [],
  validate: {
    validator: (value) => value.length <= max,
    message: `Keep this list to {MAX} entries or fewer.`.replace('{MAX}', String(max)),
  },
});

const userPreferencesSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    dietaryRestrictions: stringList(),
    /** Hard constraints. Never relaxed by recommendations or generation. */
    allergies: stringList(),
    dislikes: stringList(60),
    favoriteIngredients: stringList(60),
    favoriteCuisines: stringList(),

    cookingSkill: { type: String, enum: COOKING_SKILLS, default: 'intermediate' },
    preferredCookingTime: { type: Number, min: 5, max: 240, default: 40 },
    preferredMealTypes: {
      type: [{ type: String, enum: MEAL_TYPES }],
      default: ['lunch', 'dinner'],
    },
    preferredDifficulty: { type: String, enum: DIFFICULTIES, default: 'easy' },
    preferredServings: { type: Number, min: 1, max: 12, default: 2 },

    nutritionGoals: {
      focus: {
        type: String,
        enum: ['balanced', 'high-protein', 'low-carb', 'low-calorie', 'plant-forward', 'performance'],
        default: 'balanced',
      },
      calories: { type: Number, min: 0, max: 5000, default: null },
      protein: { type: Number, min: 0, max: 400, default: null },
      carbs: { type: Number, min: 0, max: 800, default: null },
      fat: { type: Number, min: 0, max: 400, default: null },
      notes: { type: String, trim: true, maxlength: 400, default: '' },
    },

    budget: { type: String, enum: BUDGETS, default: 'moderate' },
    preferredUnits: { type: String, enum: UNIT_SYSTEMS, default: 'imperial' },
  },
  { timestamps: true }
);

export const UserPreferences = mongoose.model('UserPreferences', userPreferencesSchema);

export function publicPreferences(preferences) {
  return {
    dietaryRestrictions: preferences.dietaryRestrictions,
    allergies: preferences.allergies,
    dislikes: preferences.dislikes,
    favoriteIngredients: preferences.favoriteIngredients,
    favoriteCuisines: preferences.favoriteCuisines,
    cookingSkill: preferences.cookingSkill,
    preferredCookingTime: preferences.preferredCookingTime,
    preferredMealTypes: preferences.preferredMealTypes,
    preferredDifficulty: preferences.preferredDifficulty,
    preferredServings: preferences.preferredServings,
    nutritionGoals: {
      focus: preferences.nutritionGoals?.focus ?? 'balanced',
      calories: preferences.nutritionGoals?.calories ?? null,
      protein: preferences.nutritionGoals?.protein ?? null,
      carbs: preferences.nutritionGoals?.carbs ?? null,
      fat: preferences.nutritionGoals?.fat ?? null,
      notes: preferences.nutritionGoals?.notes ?? '',
    },
    budget: preferences.budget,
    preferredUnits: preferences.preferredUnits,
    updatedAt: preferences.updatedAt,
  };
}
