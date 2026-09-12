import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys, useApiClient } from '@/api/client';
import type {
  ChatMessage,
  Conversation,
  CookingSession,
  CookingStatus,
  IngredientComparison,
  Recipe,
  SpeechAudio,
} from '@/api/types';

type SessionDetail = {
  session: CookingSession;
  recipe: Recipe;
  ingredients: IngredientComparison;
  conversationId: string | null;
};

export function useCookingSessions(status?: CookingStatus) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.cookingSessions(status),
    enabled: api.isReady,
    queryFn: async () =>
      (
        await api.get<{ sessions: CookingSession[] }>(
          `/cooking/sessions${status ? `?status=${status}` : ''}`
        )
      ).sessions,
  });
}

export function useCookingSession(sessionId: string | undefined) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.cookingSession(sessionId ?? 'none'),
    enabled: api.isReady && Boolean(sessionId),
    queryFn: () => api.get<SessionDetail>(`/cooking/sessions/${sessionId}`),
  });
}

/** Starts cooking, or resumes the existing active session for the same recipe. */
export function useStartCooking() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { recipeId: string; servings?: number }) =>
      api.post<{ session: CookingSession; recipe: Recipe; resumed: boolean }>(
        '/cooking/sessions',
        input
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cooking'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.bootstrap });
    },
  });
}

/**
 * Persists step progress. The screen waits for this before moving on so a cook
 * who closes the app mid-recipe comes back to the step they actually reached.
 */
export function useUpdateCookingSession(sessionId: string | undefined) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: {
      currentStep?: number;
      completeStep?: number;
      uncompleteStep?: number;
      status?: CookingStatus;
      servings?: number;
    }) =>
      (await api.patch<{ session: CookingSession }>(`/cooking/sessions/${sessionId}`, patch)).session,
    onSuccess: (session) => {
      queryClient.setQueryData<SessionDetail>(queryKeys.cookingSession(session.id), (current) =>
        current ? { ...current, session } : current
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.cookingSessions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bootstrap });
    },
  });
}

export function useAbandonCookingSession() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => api.del(`/cooking/sessions/${sessionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cooking'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.bootstrap });
    },
  });
}

export function useConversations() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.conversations,
    enabled: api.isReady,
    queryFn: async () =>
      (await api.get<{ conversations: Conversation[] }>('/conversations')).conversations,
  });
}

/**
 * Opens (or reuses) the thread for a recipe or cooking session so Plate keeps
 * the same context and history across navigation.
 */
export function useOpenConversation() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { recipeId?: string; cookingSessionId?: string }) =>
      api.post<{ conversation: Conversation; messages: ChatMessage[]; created: boolean }>(
        '/conversations',
        input
      ),
    onSuccess: ({ conversation, messages }) => {
      queryClient.setQueryData(queryKeys.conversationMessages(conversation.id), messages);
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

export function useConversationMessages(conversationId: string | undefined) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.conversationMessages(conversationId ?? 'none'),
    enabled: api.isReady && Boolean(conversationId),
    queryFn: async () =>
      (await api.get<{ messages: ChatMessage[] }>(`/conversations/${conversationId}/messages`))
        .messages,
  });
}

export type SendMessageResult = {
  messages: ChatMessage[];
  conversation: Conversation;
  audio: SpeechAudio | null;
  audioError: string | null;
};

export function useSendMessage(conversationId: string | undefined) {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      content: string;
      messageType?: 'text' | 'voice';
      image?: { base64: string; mimeType: string };
      speak?: boolean;
    }) =>
      api.post<SendMessageResult>(`/conversations/${conversationId}/messages`, input, {
        long: true,
      }),
    onSuccess: ({ messages }) => {
      // Both the question and the reply come back together; append rather than refetch.
      queryClient.setQueryData<ChatMessage[]>(
        queryKeys.conversationMessages(conversationId ?? 'none'),
        (current) => [...(current ?? []), ...messages]
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

export function useDeleteConversation() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => api.del(`/conversations/${conversationId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.conversations }),
  });
}
