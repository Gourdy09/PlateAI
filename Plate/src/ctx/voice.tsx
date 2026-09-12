import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Platform } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  createAudioPlayer,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  type AudioPlayer,
} from 'expo-audio';
import { useQuery } from '@tanstack/react-query';

import { queryKeys, useApiClient } from '@/api/client';
import type { SpeechAudio, VoiceStatus } from '@/api/types';
import { messageFromError } from '@/lib/api';
import { audioMimeTypeFor, deleteCachedFile, readFileAsBase64, writeAudioToCache } from '@/lib/media';

/**
 * Voice is a service, not a screen feature: recording, transcription, and
 * playback live here so Cooking Mode, Plate chat, and anything added later share
 * one implementation and one set of states.
 *
 * "Hey Plate" wake-word listening is intentionally not implemented. It needs an
 * always-on native wake-word engine, which this build does not ship, so the
 * microphone button is the trigger and `wakeWord.supported` reports false.
 */

export type VoicePhase = 'idle' | 'listening' | 'transcribing' | 'speaking' | 'error';

type VoiceContextValue = {
  phase: VoicePhase;
  error: string | null;
  isAvailable: boolean;
  isCheckingAvailability: boolean;
  wakeWord: VoiceStatus['wakeWord'] | null;
  meterLevel: number;
  startListening: () => Promise<boolean>;
  /** Stops recording and resolves with the transcript, or null if nothing usable. */
  stopListening: () => Promise<string | null>;
  cancelListening: () => Promise<void>;
  speak: (text: string, options?: { voiceId?: string; speed?: number }) => Promise<boolean>;
  playSpeech: (audio: SpeechAudio) => Promise<boolean>;
  stopSpeaking: () => void;
  clearError: () => void;
};

const VoiceContext = createContext<VoiceContextValue | null>(null);

export function VoiceProvider({ children }: PropsWithChildren) {
  const api = useApiClient();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);

  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const playbackUriRef = useRef<string | null>(null);

  const status = useQuery({
    queryKey: queryKeys.voiceStatus,
    enabled: api.isReady,
    queryFn: () => api.get<VoiceStatus>('/voice/status'),
    staleTime: 10 * 60 * 1000,
  });

  const releasePlayer = useCallback(() => {
    playerRef.current?.remove();
    playerRef.current = null;
    if (playbackUriRef.current) {
      deleteCachedFile(playbackUriRef.current);
      playbackUriRef.current = null;
    }
  }, []);

  useEffect(() => releasePlayer, [releasePlayer]);

  const fail = useCallback((message: string) => {
    setError(message);
    setPhase('error');
    return false;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setPhase((current) => (current === 'error' ? 'idle' : current));
  }, []);

  const startListening = useCallback(async () => {
    setError(null);
    releasePlayer();

    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        return fail('Plate needs microphone access to listen. Enable it in your device settings.');
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPhase('listening');
      return true;
    } catch (caught) {
      return fail(messageFromError(caught, 'Plate could not start the microphone.'));
    }
  }, [fail, recorder, releasePlayer]);

  const cancelListening = useCallback(async () => {
    try {
      if (recorder.isRecording) await recorder.stop();
    } catch {
      // Nothing to salvage from a failed stop; the phase reset is what matters.
    }
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    setPhase('idle');
  }, [recorder]);

  const stopListening = useCallback(async () => {
    if (!recorder.isRecording) {
      setPhase('idle');
      return null;
    }

    let uri: string | null = null;
    try {
      await recorder.stop();
      uri = recorder.uri ?? null;
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    } catch (caught) {
      fail(messageFromError(caught, 'That recording could not be saved.'));
      return null;
    }

    if (!uri) {
      fail('Plate did not capture any audio. Hold the microphone button while you speak.');
      return null;
    }

    setPhase('transcribing');
    try {
      const base64 = await readFileAsBase64(uri);
      const { text } = await api.post<{ text: string }>(
        '/voice/stt',
        { audio: { base64, mimeType: audioMimeTypeFor(uri) } },
        { long: true }
      );
      setPhase('idle');
      return text;
    } catch (caught) {
      fail(messageFromError(caught, "Plate couldn't understand that. Try again."));
      return null;
    } finally {
      if (Platform.OS !== 'web') deleteCachedFile(uri);
    }
  }, [api, fail, recorder]);

  const playSpeech = useCallback(
    async (audio: SpeechAudio) => {
      try {
        releasePlayer();
        // Recording mode must be fully released or Android will refuse playback
        // after a microphone turn (the session stays in play-and-record).
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
          shouldRouteThroughEarpiece: false,
          interruptionMode: 'doNotMix',
        }).catch(() => {});

        const uri = await writeAudioToCache(audio.audioBase64, audio.mimeType);
        playbackUriRef.current = uri;

        const player = createAudioPlayer({ uri }, { updateInterval: 200 });
        playerRef.current = player;
        player.addListener('playbackStatusUpdate', (update) => {
          if (update.didJustFinish) {
            setPhase((current) => (current === 'speaking' ? 'idle' : current));
            releasePlayer();
          }
        });

        if (!player.isLoaded) {
          await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => resolve(), 2500);
            const sub = player.addListener('playbackStatusUpdate', (update) => {
              if (update.isLoaded) {
                clearTimeout(timeout);
                sub.remove();
                resolve();
              }
            });
          });
        }

        setPhase('speaking');
        player.play();
        return true;
      } catch (caught) {
        return fail(messageFromError(caught, 'Plate could not play that reply out loud.'));
      }
    },
    [fail, releasePlayer]
  );

  const speak = useCallback(
    async (text: string, options?: { voiceId?: string; speed?: number }) => {
      if (!text.trim()) return false;
      setError(null);
      try {
        const audio = await api.post<SpeechAudio>(
          '/voice/tts',
          { text, voiceId: options?.voiceId, speed: options?.speed },
          { long: true }
        );
        return playSpeech(audio);
      } catch (caught) {
        return fail(messageFromError(caught, 'Voice is unavailable right now.'));
      }
    },
    [api, fail, playSpeech]
  );

  const stopSpeaking = useCallback(() => {
    playerRef.current?.pause();
    releasePlayer();
    setPhase((current) => (current === 'speaking' ? 'idle' : current));
  }, [releasePlayer]);

  const value: VoiceContextValue = {
    phase,
    error,
    isAvailable: status.data?.available ?? false,
    isCheckingAvailability: status.isLoading,
    wakeWord: status.data?.wakeWord ?? null,
    meterLevel: recorderState.metering ?? 0,
    startListening,
    stopListening,
    cancelListening,
    speak,
    playSpeech,
    stopSpeaking,
    clearError,
  };

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoice() {
  const context = use(VoiceContext);
  if (!context) throw new Error('useVoice must be used within VoiceProvider');
  return context;
}
