import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys, useApiClient } from '@/api/client';
import type { Cart, FridgeItem, FridgeScan, ShoppingProviders } from '@/api/types';

type FridgeInput = {
  name: string;
  quantity?: string;
  unit?: string;
  category?: string;
  expirationDate?: string | null;
  notes?: string;
};

export function useFridge() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.fridge,
    enabled: api.isReady,
    queryFn: async () => (await api.get<{ items: FridgeItem[] }>('/fridge')).items,
  });
}

/**
 * Fridge writes invalidate the feed and any open recipe, because what the cook
 * has changes both ranking and the have/missing split on a recipe.
 */
function useFridgeInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.fridge });
    queryClient.invalidateQueries({ queryKey: queryKeys.bootstrap });
    queryClient.invalidateQueries({ queryKey: ['recipe'] });
    queryClient.invalidateQueries({ queryKey: ['discovery'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.saved });
  };
}

export function useAddFridgeItem() {
  const api = useApiClient();
  const invalidate = useFridgeInvalidation();

  return useMutation({
    mutationFn: async (input: FridgeInput) =>
      (await api.post<{ item: FridgeItem }>('/fridge', input)).item,
    onSuccess: invalidate,
  });
}

export function useAddFridgeItems() {
  const api = useApiClient();
  const invalidate = useFridgeInvalidation();

  return useMutation({
    mutationFn: (items: FridgeInput[]) =>
      api.post<{ added: FridgeItem[]; skipped: string[] }>('/fridge/bulk', { items }),
    onSuccess: invalidate,
  });
}

export function useUpdateFridgeItem() {
  const api = useApiClient();
  const invalidate = useFridgeInvalidation();

  return useMutation({
    mutationFn: async ({ id, ...patch }: FridgeInput & { id: string }) =>
      (await api.patch<{ item: FridgeItem }>(`/fridge/${id}`, patch)).item,
    onSuccess: invalidate,
  });
}

export function useRemoveFridgeItem() {
  const api = useApiClient();
  const invalidate = useFridgeInvalidation();

  return useMutation({
    mutationFn: (id: string) => api.del(`/fridge/${id}`),
    onSuccess: invalidate,
  });
}

export function useScanFridge() {
  const api = useApiClient();
  return useMutation({
    mutationFn: (image: { base64: string; mimeType: string }) =>
      api.post<FridgeScan>('/fridge/scan', { image }, { long: true }),
  });
}

export function useCart() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.cart,
    enabled: api.isReady,
    queryFn: async () => (await api.get<{ cart: Cart }>('/cart')).cart,
  });
}

function useCartWriter<TInput>(
  request: (api: ReturnType<typeof useApiClient>, input: TInput) => Promise<{ cart: Cart }>
) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TInput) => request(api, input),
    onSuccess: ({ cart }) => {
      queryClient.setQueryData(queryKeys.cart, cart);
      queryClient.invalidateQueries({ queryKey: queryKeys.bootstrap });
    },
  });
}

export function useAddCartItem() {
  return useCartWriter<{
    name: string;
    quantity?: string;
    unit?: string;
    category?: string;
    note?: string;
    recipeId?: string;
  }>((api, input) => api.post('/cart/items', input));
}

export function useAddRecipeToCart() {
  const mutation = useCartWriter<{ recipeId: string; mode: 'missing' | 'all' }>((api, input) =>
    api.post('/cart/from-recipe', input)
  );
  return mutation;
}

export function useUpdateCartItem() {
  return useCartWriter<{
    id: string;
    quantity?: string;
    unit?: string;
    category?: string;
    note?: string;
    checked?: boolean;
  }>((api, { id, ...patch }) => api.patch(`/cart/items/${id}`, patch));
}

export function useRemoveCartItem() {
  return useCartWriter<string>((api, id) => api.del(`/cart/items/${id}`));
}

export function useClearCart() {
  return useCartWriter<void>((api) => api.del('/cart'));
}

/** Moves shopped items from the cart into the fridge in one write. */
export function useMoveCartToFridge() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemIds?: string[]) =>
      api.post<{ cart: Cart; moved: FridgeItem[] }>('/cart/move-to-fridge', { itemIds }),
    onSuccess: ({ cart }) => {
      queryClient.setQueryData(queryKeys.cart, cart);
      queryClient.invalidateQueries({ queryKey: queryKeys.fridge });
      queryClient.invalidateQueries({ queryKey: queryKeys.bootstrap });
      queryClient.invalidateQueries({ queryKey: ['recipe'] });
      queryClient.invalidateQueries({ queryKey: ['discovery'] });
    },
  });
}

export function useShoppingProviders() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.shoppingProviders,
    enabled: api.isReady,
    queryFn: () => api.get<ShoppingProviders>('/shopping/providers'),
    staleTime: 10 * 60 * 1000,
  });
}
