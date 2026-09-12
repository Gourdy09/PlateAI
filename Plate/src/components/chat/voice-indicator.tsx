import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { VoicePhase } from '@/ctx/voice';

export type AssistantState = VoicePhase | 'thinking';

/**
 * Shows exactly which stage the assistant is in. Every state here maps to real
 * work: recording, an ElevenLabs transcription, a Gemini reply, or playback.
 */
export function VoiceIndicator({
  state,
  error,
  onDismissError,
}: {
  state: AssistantState;
  error?: string | null;
  onDismissError?: () => void;
}) {
  const theme = useTheme();

  if (state === 'error' && error) {
    return (
      <View style={[styles.pill, { backgroundColor: theme.errorWash }]}>
        <Icon name="warning" size={15} color={theme.error} />
        <AppText variant="caption" tint={theme.error} style={styles.label}>
          {error}
        </AppText>
        {onDismissError ? (
          <AppText variant="caption" tint={theme.error} onPress={onDismissError} suppressHighlighting>
            Dismiss
          </AppText>
        ) : null}
      </View>
    );
  }

  if (state === 'idle') return null;

  const copy: Record<Exclude<AssistantState, 'idle' | 'error'>, { label: string; icon: 'mic' | 'sparkle' | 'speaker' }> =
    {
      listening: { label: 'Listening — tap the microphone when you are done', icon: 'mic' },
      transcribing: { label: 'Turning your voice into words…', icon: 'sparkle' },
      thinking: { label: 'Plate is thinking…', icon: 'sparkle' },
      speaking: { label: 'Speaking', icon: 'speaker' },
    };

  const current = copy[state as keyof typeof copy];
  if (!current) return null;

  return (
    <View style={[styles.pill, { backgroundColor: theme.accentWash }]}>
      <Icon name={current.icon} size={15} color={theme.accent} />
      <AppText variant="caption" tint={theme.accent} style={styles.label}>
        {current.label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  label: {
    flex: 1,
  },
});
