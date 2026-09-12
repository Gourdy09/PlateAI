import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys, useApiClient } from '@/api/client';
import type {
  DiscoveryFilters,
  Recipe,
  RecipeDetail,
  Substitution,
  SwipeDirection,
} from '@/api/types';

function filterQuery(filters: DiscoveryFilters & { limit?: number }) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

/**
 * The discovery feed. Generation happens server-side when the ranked pool runs
 * dry, so this can take a while — hence the extended timeout.
 */
export function useDiscovery(filters: DiscoveryFilters, limit = 8) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.discovery({ ...filters, limit }),
    enabled: api.isReady,
    queryFn: () =>
      api.get<{ recipes: Recipe[]; meta: { generated: number; poolSize: number } }>(
        `/recipes/recommendations${filterQuery({ ...filters, limit })}`,
        { long: true }
      ),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useRecipe(recipeId: string | undefined) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.recipe(recipeId ?? 'none'),
    enabled: api.isReady && Boolean(recipeId),
    queryFn: () => api.get<RecipeDetail>(`/recipes/${recipeId}`),
  });
}

export function useSavedRecipes() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.saved,
    enabled: api.isReady,
    queryFn: async () => (await api.get<{ recipes: Recipe[] }>('/saved')).recipes,
  });
}

export type SwipeHistoryEntry = {
  direction: SwipeDirection;
  createdAt: string;
  recipe: Recipe;
};

export function useSwipeHistory(direction?: SwipeDirection) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.swipes(direction),
    enabled: api.isReady,
    queryFn: async () =>
      (
        await api.get<{ swipes: SwipeHistoryEntry[] }>(
          `/swipes${direction ? `?direction=${direction}` : ''}`
        )
      ).swipes,
  });
}

export function useRecipeHistory() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.recipeHistory,
    enabled: api.isReady,
    queryFn: async () => (await api.get<{ recipes: Recipe[] }>('/recipes/history')).recipes,
  });
}

/**
 * Records a swipe. The card animation runs locally but the deck only drops the
 * recipe once MongoDB has the swipe, so a failed write puts the card back.
 */
export function useSwipe() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { recipeId: string; direction: SwipeDirection }) =>
      api.post<{ saved: boolean }>('/swipes', input),
    onSuccess: (_result, input) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.saved });
      queryClient.invalidateQueries({ queryKey: queryKeys.bootstrap });
      queryClient.invalidateQueries({ queryKey: queryKeys.recipe(input.recipeId) });
    },
  });
}

export function useUndoSwipe() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.post<{ undone: { recipeId: string; direction: SwipeDirection } | null; recipe: Recipe | null }>(
        '/swipes/undo'
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.saved });
      queryClient.invalidateQueries({ queryKey: queryKeys.bootstrap });
    },
  });
}

export function useToggleSaved() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipeId, saved }: { recipeId: string; saved: boolean }) => {
      if (saved) await api.del(`/saved/${recipeId}`);
      else await api.post('/saved', { recipeId });
      return !saved;
    },
    onSuccess: (nowSaved, { recipeId }) => {
      queryClient.setQueryData<RecipeDetail>(queryKeys.recipe(recipeId), (current) =>
        current ? { ...current, saved: nowSaved } : current
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.saved });
      queryClient.invalidateQueries({ queryKey: queryKeys.bootstrap });
    },
  });
}

export function useGenerateRecipe() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { prompt: string } & DiscoveryFilters) =>
      (await api.post<{ recipe: Recipe }>('/recipes/generate', input, { long: true })).recipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipeHistory });
      queryClient.invalidateQueries({ queryKey: ['discovery'] });
    },
  });
}

export function useFridgeRecipes() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: { count?: number; notes?: string; strict?: boolean } & DiscoveryFilters
    ) =>
      (
        await api.post<{ recipes: (Recipe & { missingIngredients: string[] })[] }>(
          '/recipes/from-fridge',
          input,
          { long: true }
        )
      ).recipes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipeHistory });
    },
  });
}

export function useAdaptRecipe(recipeId: string | undefined) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { servings?: number; instruction?: string }) =>
      (
        await api.post<{ recipe: Recipe }>(`/recipes/${recipeId}/adapt`, input, { long: true })
      ).recipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipeHistory });
    },
  });
}

export function useSubstitutions(recipeId: string | undefined) {
  const api = useApiClient();
  return useMutation({
    mutationFn: (ingredient: string) =>
      api.post<Substitution>(`/recipes/${recipeId}/substitutions`, { ingredient }, { long: true }),
  });
}
