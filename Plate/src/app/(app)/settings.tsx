import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { OptionRow, SegmentedControl, ToggleRow } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/screen';
import { Sheet } from '@/components/ui/sheet';
import { ErrorState, LoadingState, Notice } from '@/components/ui/states';
import { Card, Chip, ChipWrap, Divider, Section } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useToast } from '@/ctx/toast';
import { useVoice } from '@/ctx/voice';
import { useTheme } from '@/hooks/use-theme';
import { useBootstrap, useSettings, useUpdateSettings } from '@/api/use-account';
import { useVoiceStatus, useVoices } from '@/api/use-voice';
import type { AppSettings, ThemeMode } from '@/api/types';

const SPEEDS = [0.8, 0.9, 1, 1.1, 1.2];

export default function SettingsScreen() {
  const toast = useToast();
  const voice = useVoice();
  const settings = useSettings();
  const bootstrap = useBootstrap();
  const update = useUpdateSettings();
  const voiceStatus = useVoiceStatus();

  const [voiceSheetOpen, setVoiceSheetOpen] = useState(false);
  const voices = useVoices(voiceSheetOpen);

  const value = settings.data;
  const capabilities = bootstrap.data?.capabilities;

  const patch = (next: Partial<AppSettings>) =>
    update.mutate(next, {
      onError: (error) => toast.showError(error, 'That setting could not be saved.'),
    });

  const selectedVoice = voices.data?.find((item) => item.id === value?.preferredVoice);

  return (
    <Screen>
      <ScreenHeader eyebrow="App" title="Settings" onBack />

      {settings.isPending ? (
        <LoadingState label="Loading settings…" />
      ) : settings.isError || !value ? (
        <ErrorState
          error={settings.error}
          fallback="Settings could not load."
          onRetry={() => settings.refetch()}
        />
      ) : (
        <ScreenScroll>
          <Section title="Appearance">
            <Card>
              <View style={styles.stack}>
                <SegmentedControl
                  options={[
                    { value: 'system' as ThemeMode, label: 'System' },
                    { value: 'light' as ThemeMode, label: 'Light' },
                    { value: 'dark' as ThemeMode, label: 'Dark' },
                  ]}
                  value={value.theme}
                  onChange={(next) => patch({ theme: next })}
                />
                <AppText variant="caption" color="textSecondary">
                  System follows the light and dark setting on your phone, which is how Plate starts
                  out.
                </AppText>
                <Divider />
                <ToggleRow
                  label="Reduce motion"
                  description="Skips the swipe animation and other movement."
                  value={value.reduceMotion}
                  onValueChange={(next) => patch({ reduceMotion: next })}
                />
                <ToggleRow
                  label="Haptics"
                  description="Small vibrations when you swipe and advance a step."
                  value={value.hapticsEnabled}
                  onValueChange={(next) => patch({ hapticsEnabled: next })}
                />
                <ToggleRow
                  label="Show nutrition on cards"
                  value={value.showNutritionOnCards}
                  onValueChange={(next) => patch({ showNutritionOnCards: next })}
                />
              </View>
            </Card>
          </Section>

          <Section title="Voice">
            {!capabilities?.voice ? (
              <Notice
                tone="info"
                title="Voice is not configured"
                message="This Plate server has no ElevenLabs API key, so speaking and listening are unavailable. Everything else works by typing."
              />
            ) : null}

            <Card>
              <View style={styles.stack}>
                <ToggleRow
                  label="Voice replies"
                  description="Lets Plate speak and listen."
                  value={value.voiceEnabled}
                  onValueChange={(next) => patch({ voiceEnabled: next })}
                  disabled={!capabilities?.voice}
                />
                <ToggleRow
                  label="Speak every reply"
                  description="Reads answers aloud even when you typed the question."
                  value={value.autoSpeakReplies}
                  onValueChange={(next) => patch({ autoSpeakReplies: next })}
                  disabled={!capabilities?.voice || !value.voiceEnabled}
                />
                <Divider />
                <OptionRow
                  label="Voice"
                  icon="speaker"
                  value={selectedVoice?.name ?? (value.preferredVoice ? 'Custom' : 'Default')}
                  onPress={() => setVoiceSheetOpen(true)}
                />
                <View style={styles.field}>
                  <AppText variant="body">Speaking speed</AppText>
                  <ChipWrap>
                    {SPEEDS.map((speed) => (
                      <Chip
                        key={speed}
                        label={speed === 1 ? 'Normal' : `${speed}x`}
                        selected={Math.abs(value.voiceSpeed - speed) < 0.01}
                        onPress={() => patch({ voiceSpeed: speed })}
                      />
                    ))}
                  </ChipWrap>
                </View>
                {capabilities?.voice && value.voiceEnabled ? (
                  <Button
                    label="Hear a sample"
                    icon="speaker"
                    variant="secondary"
                    size="sm"
                    onPress={() =>
                      voice.speak(
                        'Your pan is hot enough when a drop of water skitters across it. Add the oil now.'
                      )
                    }
                  />
                ) : null}
              </View>
            </Card>

            {voiceStatus.data && !voiceStatus.data.wakeWord.supported ? (
              <Notice
                tone="info"
                icon="mic"
                title={`"${voiceStatus.data.wakeWord.phrase}" is not listening in the background`}
                message="Always-on wake-word detection needs a native listening engine that this build does not include. Tap the microphone button to talk to Plate."
              />
            ) : null}
          </Section>

          <Section title="What this server can do" subtitle="Reported by the backend, not assumed.">
            <Card padded={false} style={styles.menu}>
              <CapabilityRow label="Recipe generation and assistant (Gemini)" enabled={capabilities?.ai} />
              <Divider />
              <CapabilityRow label="Voice (ElevenLabs)" enabled={capabilities?.voice} />
              <Divider />
              <CapabilityRow label="Recipe photography" enabled={capabilities?.recipeImages} />
              <Divider />
              <CapabilityRow label="Grocery ordering" enabled={capabilities?.grocery} />
            </Card>
            {!capabilities?.grocery ? (
              <AppText variant="caption" color="textTertiary">
                No grocery service is connected, so Plate does not show prices, delivery times, or
                place orders. Your cart works as a shopping list.
              </AppText>
            ) : null}
          </Section>
        </ScreenScroll>
      )}

      <Sheet
        visible={voiceSheetOpen}
        onClose={() => setVoiceSheetOpen(false)}
        title="Choose a voice"
        subtitle="Voices come from the ElevenLabs account this server uses.">
        {voices.isPending ? (
          <LoadingState compact label="Loading voices…" />
        ) : voices.isError ? (
          <ErrorState
            error={voices.error}
            fallback="The voice list could not load."
            onRetry={() => voices.refetch()}
            compact
          />
        ) : (voices.data ?? []).length === 0 ? (
          <AppText variant="small" color="textSecondary">
            No voices are available on this account.
          </AppText>
        ) : (
          (voices.data ?? []).map((item) => (
            <OptionRow
              key={item.id}
              label={item.name}
              description={[item.accent, item.description].filter(Boolean).join(' · ') || undefined}
              icon={value?.preferredVoice === item.id ? 'check-circle' : 'speaker'}
              showChevron={false}
              onPress={() => {
                patch({ preferredVoice: item.id });
                setVoiceSheetOpen(false);
              }}
            />
          ))
        )}
      </Sheet>
    </Screen>
  );
}

function CapabilityRow({ label, enabled }: { label: string; enabled: boolean | undefined }) {
  const theme = useTheme();
  return (
    <View style={styles.capability}>
      <Icon
        name={enabled ? 'check-circle' : 'info'}
        size={18}
        color={enabled ? theme.success : theme.textTertiary}
      />
      <AppText variant="body" style={styles.capabilityLabel}>
        {label}
      </AppText>
      <AppText variant="small" color={enabled ? 'textSecondary' : 'textTertiary'}>
        {enabled ? 'Ready' : 'Not configured'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.two,
  },
  field: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  menu: {
    paddingHorizontal: Spacing.three,
  },
  capability: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    paddingVertical: Spacing.three - 2,
  },
  capabilityLabel: {
    flex: 1,
  },
});
