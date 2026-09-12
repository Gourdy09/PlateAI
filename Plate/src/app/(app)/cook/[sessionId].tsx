import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';

import { StepTimer } from '@/components/cooking/step-timer';
import { IngredientList } from '@/components/recipe/ingredient-list';
import { VoiceIndicator, type AssistantState } from '@/components/chat/voice-indicator';
import { Button, IconButton } from '@/components/ui/button';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { Sheet } from '@/components/ui/sheet';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { Card, Chip, Section } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { Elevation, Radius, Spacing } from '@/constants/theme';
import { useToast } from '@/ctx/toast';
import { useVoice } from '@/ctx/voice';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/lib/haptics';
import { useSettings } from '@/api/use-account';
import {
  useAbandonCookingSession,
  useCookingSession,
  useOpenConversation,
  useSendMessage,
  useUpdateCookingSession,
} from '@/api/use-cooking';

/**
 * Cooking Mode. Step position lives in MongoDB, so closing the app mid-recipe and
 * coming back lands on the same step.
 */
export default function CookingModeScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const toast = useToast();
  const voice = useVoice();
  const haptics = useHaptics();
  useKeepAwake();

  const detail = useCookingSession(sessionId);
  const update = useUpdateCookingSession(sessionId);
  const abandon = useAbandonCookingSession();
  const settings = useSettings();
  const openConversation = useOpenConversation();

  /** Set only when this screen had to create the thread itself. */
  const [openedThreadId, setOpenedThreadId] = useState<string | null>(null);
  const [reply, setReply] = useState<string | null>(null);
  const [ingredientsOpen, setIngredientsOpen] = useState(false);

  const conversationId = openedThreadId ?? detail.data?.conversationId ?? null;
  const sendMessage = useSendMessage(conversationId ?? undefined);

  const session = detail.data?.session;
  const recipe = detail.data?.recipe;
  const steps = recipe?.instructions ?? [];
  const currentStep = Math.min(session?.currentStep ?? 0, Math.max(steps.length - 1, 0));
  const completed = useMemo(() => new Set(session?.completedSteps ?? []), [session?.completedSteps]);

  // The assistant thread for this session is opened lazily, on first use.
  const ensureThread = async () => {
    if (conversationId) return conversationId;
    const result = await openConversation.mutateAsync({ cookingSessionId: sessionId });
    setOpenedThreadId(result.conversation.id);
    return result.conversation.id;
  };

  const goToStep = async (nextStep: number, markCurrentComplete: boolean) => {
    haptics.tap();
    try {
      await update.mutateAsync({
        currentStep: nextStep,
        ...(markCurrentComplete ? { completeStep: currentStep } : {}),
      });
    } catch (error) {
      toast.showError(error, 'That step could not be saved.');
    }
  };

  const finish = async () => {
    try {
      await update.mutateAsync({ completeStep: currentStep, status: 'completed' });
      haptics.success();
      toast.show('Nice work. This one is marked as cooked.', 'success');
      router.back();
    } catch (error) {
      toast.showError(error, 'The session could not be completed.');
    }
  };

  const askByVoice = async () => {
    if (voice.phase === 'listening') {
      const transcript = await voice.stopListening();
      if (!transcript?.trim()) {
        if (transcript !== null) toast.show('Plate did not catch that. Try again.');
        return;
      }
      try {
        const thread = await ensureThread();
        if (!thread) return;
        const result = await sendMessage.mutateAsync({
          content: transcript,
          messageType: 'voice',
          speak: settings.data?.voiceEnabled ?? true,
        });
        const answer = result.messages.find((message) => message.role === 'assistant');
        setReply(answer?.content ?? null);
        if (result.audio) await voice.playSpeech(result.audio);
        else if (result.audioError) toast.show(result.audioError, 'error');
      } catch (error) {
        toast.showError(error, 'Plate could not answer that.');
      }
      return;
    }

    voice.clearError();
    try {
      await ensureThread();
    } catch (error) {
      toast.showError(error, 'The assistant could not open.');
      return;
    }
    await voice.startListening();
  };

  if (detail.isPending) {
    return (
      <Screen>
        <LoadingState label="Opening cooking mode…" />
      </Screen>
    );
  }

  if (detail.isError || !session || !recipe) {
    return (
      <Screen>
        <View style={styles.errorWrap}>
          <ErrorState
            error={detail.error}
            fallback="That cooking session could not be opened."
            onRetry={() => detail.refetch()}
          />
          <Button label="Go back" variant="ghost" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const isLastStep = currentStep >= steps.length - 1;
  const assistantState: AssistantState = sendMessage.isPending ? 'thinking' : voice.phase;

  return (
    <Screen>
      <ScreenHeader
        eyebrow={`Step ${currentStep + 1} of ${steps.length}`}
        title={recipe.title}
        compact
        onBack={() => router.back()}
        right={
          <IconButton
            name="list"
            onPress={() => setIngredientsOpen(true)}
            accessibilityLabel="Show ingredients"
            size={40}
          />
        }
      />

      <View style={styles.progressRow}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              {
                backgroundColor:
                  index === currentStep
                    ? theme.primary
                    : completed.has(index)
                      ? theme.accent
                      : theme.border,
                flex: index === currentStep ? 1.6 : 1,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator>
        <Card style={styles.stepCard}>
          <AppText variant="eyebrow" tint={theme.primary} uppercase>
            {completed.has(currentStep) ? 'Done' : 'Now'}
          </AppText>
          <AppText variant="title" style={styles.stepText}>
            {steps[currentStep]}
          </AppText>
          <StepTimer key={currentStep} step={steps[currentStep] ?? ''} />
        </Card>

        {steps[currentStep + 1] ? (
          <Card style={styles.nextCard} elevated={false}>
            <AppText variant="caption" color="textTertiary" uppercase>
              Next
            </AppText>
            <AppText variant="small" color="textSecondary" numberOfLines={3}>
              {steps[currentStep + 1]}
            </AppText>
          </Card>
        ) : null}

        {reply ? (
          <Card style={styles.replyCard}>
            <View style={styles.replyHeader}>
              <AppText variant="eyebrow" tint={theme.accent} uppercase>
                Plate says
              </AppText>
              <IconButton
                name="close"
                size={30}
                variant="plain"
                onPress={() => setReply(null)}
                accessibilityLabel="Dismiss answer"
              />
            </View>
            <AppText variant="body">{reply}</AppText>
            <Chip
              label="Open full conversation"
              icon="mic"
              onPress={() =>
                router.push({
                  pathname: '/(app)/chat',
                  params: conversationId ? { conversationId } : { sessionId },
                })
              }
            />
          </Card>
        ) : null}

        <VoiceIndicator state={assistantState} error={voice.error} onDismissError={voice.clearError} />
      </ScrollView>

      <View
        style={[
          styles.footer,
          Elevation.raised,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}>
        <View style={styles.footerRow}>
          <IconButton
            name="arrow-left"
            size={50}
            onPress={() => goToStep(Math.max(0, currentStep - 1), false)}
            accessibilityLabel="Previous step"
            disabled={currentStep === 0 || update.isPending}
          />

          <Button
            label={isLastStep ? 'Finish cooking' : 'Next step'}
            icon={isLastStep ? 'check' : 'arrow-right'}
            iconPosition="right"
            onPress={() => (isLastStep ? finish() : goToStep(currentStep + 1, true))}
            loading={update.isPending}
            style={styles.footerPrimary}
          />

          <IconButton
            name={voice.phase === 'listening' ? 'stop' : 'mic'}
            size={50}
            variant={voice.phase === 'listening' ? 'primary' : 'surface'}
            onPress={askByVoice}
            accessibilityLabel={voice.phase === 'listening' ? 'Stop listening' : 'Ask Plate a question'}
            disabled={sendMessage.isPending || voice.phase === 'transcribing'}
          />
        </View>

        <Button
          label="Stop cooking"
          variant="ghost"
          size="sm"
          onPress={() =>
            abandon
              .mutateAsync(sessionId)
              .then(() => router.back())
              .catch((error) => toast.showError(error, 'The session could not be stopped.'))
          }
          loading={abandon.isPending}
        />
      </View>

      <Sheet
        visible={ingredientsOpen}
        onClose={() => setIngredientsOpen(false)}
        title="Ingredients"
        subtitle={`For ${session.servings ?? recipe.servings} servings`}>
        {detail.data?.ingredients.have.length ? (
          <Section title="In your fridge">
            <IngredientList ingredients={detail.data.ingredients.have} state="have" />
          </Section>
        ) : null}
        {detail.data?.ingredients.missing.length ? (
          <Section title="Still needed">
            <IngredientList ingredients={detail.data.ingredients.missing} state="missing" />
          </Section>
        ) : null}
        {detail.data?.ingredients.optional.length ? (
          <Section title="Optional">
            <IngredientList ingredients={detail.data.ingredients.optional} state="optional" />
          </Section>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  progressDot: {
    height: 5,
    borderRadius: Radius.pill,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
    flexGrow: 1,
  },
  stepCard: {
    gap: Spacing.three,
  },
  stepText: {
    lineHeight: 32,
  },
  nextCard: {
    gap: 4,
  },
  replyCard: {
    gap: Spacing.two,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  footerPrimary: {
    flex: 1,
  },
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
  },
});
