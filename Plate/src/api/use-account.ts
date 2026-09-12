import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys, useApiClient } from '@/api/client';
import type { AppSettings, Bootstrap, MetaOptions, Preferences } from '@/api/types';

/**
 * One call at launch: identity, preferences, settings, counts, the active cooking
 * session, and which integrations this backend actually has configured.
 */
export function useBootstrap() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.bootstrap,
    enabled: api.isReady,
    queryFn: () => api.get<Bootstrap>('/users/me'),
    staleTime: 60_000,
  });
}

/** Option vocabulary comes from the server so the UI cannot offer invalid values. */
export function useMetaOptions() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.meta,
    enabled: api.isReady,
    queryFn: () => api.get<MetaOptions>('/meta/options'),
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function usePreferences() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.preferences,
    enabled: api.isReady,
    queryFn: async () => (await api.get<{ preferences: Preferences }>('/preferences')).preferences,
    staleTime: 60_000,
  });
}

/**
 * Preferences are written to MongoDB first and the cache is filled from the
 * server's response, so the UI never shows a change that did not persist.
 */
export function useUpdatePreferences() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: Partial<Preferences>) =>
      (await api.patch<{ preferences: Preferences }>('/preferences', patch)).preferences,
    onSuccess: (preferences) => {
      queryClient.setQueryData(queryKeys.preferences, preferences);
      queryClient.setQueryData<Bootstrap>(queryKeys.bootstrap, (current) =>
        current ? { ...current, preferences } : current
      );
      // Changing a constraint changes what may be recommended.
      queryClient.invalidateQueries({ queryKey: ['discovery'] });
      queryClient.invalidateQueries({ queryKey: ['recipe'] });
    },
  });
}

export function useUpdateAllergies() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (allergies: string[]) =>
      (await api.put<{ preferences: Preferences }>('/preferences/allergies', { allergies }))
        .preferences,
    onSuccess: (preferences) => {
      queryClient.setQueryData(queryKeys.preferences, preferences);
      queryClient.setQueryData<Bootstrap>(queryKeys.bootstrap, (current) =>
        current ? { ...current, preferences } : current
      );
      queryClient.invalidateQueries({ queryKey: ['discovery'] });
      queryClient.invalidateQueries({ queryKey: ['recipe'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.saved });
    },
  });
}

export function useSettings() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.settings,
    enabled: api.isReady,
    queryFn: async () => (await api.get<{ settings: AppSettings }>('/settings')).settings,
    staleTime: 60_000,
  });
}

export function useUpdateSettings() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: Partial<AppSettings>) =>
      (await api.patch<{ settings: AppSettings }>('/settings', patch)).settings,
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.settings, settings);
      queryClient.setQueryData<Bootstrap>(queryKeys.bootstrap, (current) =>
        current ? { ...current, settings } : current
      );
    },
  });
}

export function useUpdateProfile() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: { name: string }) =>
      (await api.patch<{ user: Bootstrap['user'] }>('/users/me', patch)).user,
    onSuccess: (user) => {
      queryClient.setQueryData<Bootstrap>(queryKeys.bootstrap, (current) =>
        current ? { ...current, user } : current
      );
    },
  });
}
