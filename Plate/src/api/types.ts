/** Response shapes returned by the Plate API. Mirrors the server's public* mappers. */

export type Difficulty = 'easy' | 'medium' | 'hard';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';
export type CookingSkill = 'beginner' | 'intermediate' | 'advanced';
export type Budget = 'budget' | 'moderate' | 'premium';
export type UnitSystem = 'imperial' | 'metric';
export type ThemeMode = 'system' | 'light' | 'dark';
export type SwipeDirection = 'right' | 'left';
export type CookingStatus = 'active' | 'completed' | 'abandoned';

export type Option = { value: string; label: string };

export type MetaOptions = {
  allergens: Option[];
  diets: Option[];
  cuisines: string[];
  mealTypes: Option[];
  difficulties: Option[];
  cookingSkills: Option[];
  budgets: Option[];
  unitSystems: Option[];
  fridgeCategories: Option[];
  nutritionFocuses: Option[];
  themes: Option[];
};

export type Nutrition = {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sodium: number | null;
};

export type NutritionFocus =
  | 'balanced'
  | 'high-protein'
  | 'low-carb'
  | 'low-calorie'
  | 'plant-forward'
  | 'performance';

export type RecipeIngredient = {
  name: string;
  quantity: string;
  unit: string;
  optional: boolean;
  note: string;
};

export type Recipe = {
  id: string;
  title: string;
  description: string;
  image: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  difficulty: Difficulty;
  cuisine: string;
  dietaryTags: string[];
  nutrition: Nutrition;
  allergens: string[];
  source: 'gemini' | 'user' | 'import';
  generatedByAI: boolean;
  createdAt: string;
  /** Present on discovery and saved responses. */
  fridgeCoverage?: number;
  savedAt?: string;
};

export type MatchedIngredient = RecipeIngredient & {
  matchedFridgeItem: { id: string; name: string; quantity: string; unit: string } | null;
};

export type IngredientComparison = {
  have: MatchedIngredient[];
  missing: MatchedIngredient[];
  optional: MatchedIngredient[];
  fridgeCoverage?: number;
};

export type ConstraintWarnings = {
  allergyViolations: { allergy: string; label: string; matches: string[] }[];
  dietViolations: { diet: string; label: string; matches: string[] }[];
  dislikeMatches: string[];
};

export type RecipeDetail = {
  recipe: Recipe;
  saved: boolean;
  ingredients: IngredientComparison;
  fridgeCoverage: number;
  warnings: ConstraintWarnings;
};

export type Preferences = {
  dietaryRestrictions: string[];
  allergies: string[];
  dislikes: string[];
  favoriteIngredients: string[];
  favoriteCuisines: string[];
  cookingSkill: CookingSkill;
  preferredCookingTime: number;
  preferredMealTypes: MealType[];
  preferredDifficulty: Difficulty;
  preferredServings: number;
  nutritionGoals: {
    focus: NutritionFocus;
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
    notes: string;
  };
  budget: Budget;
  preferredUnits: UnitSystem;
  updatedAt: string;
};

export type AppSettings = {
  theme: ThemeMode;
  voiceEnabled: boolean;
  voiceSpeed: number;
  preferredVoice: string;
  autoSpeakReplies: boolean;
  hapticsEnabled: boolean;
  reduceMotion: boolean;
  showNutritionOnCards: boolean;
  updatedAt: string;
};

export type CookingSession = {
  id: string;
  recipeId: string;
  recipeTitle: string | null;
  recipeImage: string | null;
  totalSteps: number | null;
  currentStep: number;
  completedSteps: number[];
  servings: number | null;
  status: CookingStatus;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
};

export type Bootstrap = {
  user: { id: string; name: string; email: string; profileImage: string | null; createdAt: string };
  preferences: Preferences;
  settings: AppSettings;
  stats: {
    savedRecipes: number;
    swipes: number;
    fridgeItems: number;
    recipesCooked: number;
    cartItems: number;
  };
  activeCookingSession: CookingSession | null;
  capabilities: { ai: boolean; voice: boolean; recipeImages: boolean; grocery: boolean };
};

export type FridgeItem = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  category: string;
  expirationDate: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type CartItem = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  category: string;
  recipeIds: string[];
  note: string;
  checked: boolean;
};

export type Cart = { id: string; items: CartItem[]; updatedAt: string };

export type Conversation = {
  id: string;
  title: string;
  recipeId: string | null;
  cookingSessionId: string | null;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
  recipeTitle?: string | null;
  recipeImage?: string | null;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  messageType: 'text' | 'voice' | 'image';
  imageSummary: string;
  createdAt: string;
};

export type SpeechAudio = {
  audioBase64: string;
  mimeType: string;
  voiceId: string;
  spokenText: string;
  truncated: boolean;
};

export type VoiceStatus = {
  available: boolean;
  wakeWord: { supported: boolean; phrase: string; trigger: string };
};

export type ElevenLabsVoice = {
  id: string;
  name: string;
  accent: string | null;
  description: string | null;
  previewUrl: string | null;
};

export type Substitution = {
  ingredient: string;
  options: { name: string; amount: string; impact: string }[];
  notes: string;
};

export type FridgeScan = {
  summary: string;
  uncertain: string[];
  suggestions: { name: string; confidence: 'high' | 'medium' | 'low' }[];
};

export type ShoppingProviders = {
  providers: { id: string; name: string; capabilities: string[] }[];
  connected: boolean;
  message?: string;
};

export type DiscoveryFilters = {
  mealType?: MealType;
  difficulty?: Difficulty;
  cuisine?: string;
  maxTime?: number;
  servings?: number;
};
