import { useQuery } from '@tanstack/react-query';

import { queryKeys, useApiClient } from '@/api/client';
import type { ElevenLabsVoice, VoiceStatus } from '@/api/types';

/** Whether the server has ElevenLabs configured, plus the wake-word truth. */
export function useVoiceStatus() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.voiceStatus,
    enabled: api.isReady,
    queryFn: () => api.get<VoiceStatus>('/voice/status'),
    staleTime: 10 * 60 * 1000,
  });
}

/** The real voice list from the connected ElevenLabs account. */
export function useVoices(enabled: boolean) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.voices,
    enabled: api.isReady && enabled,
    queryFn: async () => (await api.get<{ voices: ElevenLabsVoice[] }>('/voice/voices')).voices,
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
}
