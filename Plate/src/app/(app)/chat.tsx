import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Composer } from '@/components/chat/composer';
import { MessageBubble } from '@/components/chat/message-bubble';
import { VoiceIndicator, type AssistantState } from '@/components/chat/voice-indicator';
import { IconButton } from '@/components/ui/button';
import { Screen, ScreenHeader } from '@/components/ui/screen';
import { Sheet } from '@/components/ui/sheet';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { Card, Chip, ChipWrap } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useToast } from '@/ctx/toast';
import { useVoice } from '@/ctx/voice';
import { PhotoPermissionError, pickPhotoFromLibrary, takePhoto, type PickedPhoto } from '@/lib/photos';
import { useBootstrap, useSettings } from '@/api/use-account';
import {
  useConversationMessages,
  useConversations,
  useDeleteConversation,
  useOpenConversation,
  useSendMessage,
} from '@/api/use-cooking';
import type { ChatMessage } from '@/api/types';

const NO_MESSAGES: ChatMessage[] = [];

const STARTERS = [
  'What can I make with what I have?',
  'How do I know when chicken is done?',
  'Give me a 20 minute dinner',
  'What can I use instead of butter?',
];

export default function PlateChatScreen() {
  const params = useLocalSearchParams<{ conversationId?: string; sessionId?: string; recipeId?: string }>();
  const router = useRouter();
  const toast = useToast();
  const voice = useVoice();

  const bootstrap = useBootstrap();
  const settings = useSettings();
  const conversations = useConversations();
  const openConversation = useOpenConversation();
  const deleteConversation = useDeleteConversation();

  const [conversationId, setConversationId] = useState<string | undefined>(params.conversationId);
  const [draft, setDraft] = useState('');
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const scroller = useRef<ScrollView | null>(null);
  const opened = useRef(false);

  const messages = useConversationMessages(conversationId);
  const sendMessage = useSendMessage(conversationId);

  // Resolve the thread once: the one passed in, or the general thread for this user.
  useEffect(() => {
    if (conversationId || opened.current) return;
    opened.current = true;
    openConversation
      .mutateAsync({
        recipeId: params.recipeId,
        cookingSessionId: params.sessionId,
      })
      .then((result) => setConversationId(result.conversation.id))
      .catch((error) => toast.showError(error, 'The assistant could not open.'));
  }, [conversationId, openConversation, params.recipeId, params.sessionId, toast]);

  const list = messages.data ?? NO_MESSAGES;
  const lastAssistant = useMemo(
    () => [...list].reverse().find((message) => message.role === 'assistant') ?? null,
    [list]
  );

  useEffect(() => {
    if (list.length > 0) {
      const timer = setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 80);
      return () => clearTimeout(timer);
    }
  }, [list.length]);

  const autoSpeak = settings.data?.autoSpeakReplies ?? false;
  const voiceEnabled = (settings.data?.voiceEnabled ?? true) && voice.isAvailable;

  const send = useCallback(
    async (content: string, options?: { fromVoice?: boolean }) => {
      const trimmed = content.trim();
      if (!conversationId || (!trimmed && !photo)) return;

      const attachment = photo;
      setDraft('');
      setPhoto(null);

      try {
        const result = await sendMessage.mutateAsync({
          content: trimmed,
          messageType: options?.fromVoice ? 'voice' : 'text',
          image: attachment ? { base64: attachment.base64, mimeType: attachment.mimeType } : undefined,
          speak: voiceEnabled && (autoSpeak || Boolean(options?.fromVoice)),
        });

        if (result.audio) await voice.playSpeech(result.audio);
        else if (result.audioError) toast.show(result.audioError, 'error');
      } catch (error) {
        // Put the message back so nothing the cook typed is lost.
        setDraft(trimmed);
        setPhoto(attachment);
        toast.showError(error, 'Plate could not answer that. Try again.');
      }
    },
    [autoSpeak, conversationId, photo, sendMessage, toast, voice, voiceEnabled]
  );

  const startVoice = useCallback(async () => {
    voice.clearError();
    await voice.startListening();
  }, [voice]);

  const stopVoice = useCallback(async () => {
    const transcript = await voice.stopListening();
    if (transcript?.trim()) await send(transcript, { fromVoice: true });
    else if (transcript !== null) toast.show('Plate did not catch any words. Try again.');
  }, [send, toast, voice]);

  const attach = useCallback(
    async (source: 'camera' | 'library') => {
      try {
        const picked = source === 'camera' ? await takePhoto() : await pickPhotoFromLibrary();
        if (picked) setPhoto(picked);
      } catch (error) {
        if (error instanceof PhotoPermissionError) toast.show(error.message, 'error');
        else toast.showError(error, 'That photo could not be attached.');
      }
    },
    [toast]
  );

  const assistantState: AssistantState = sendMessage.isPending ? 'thinking' : voice.phase;
  const aiAvailable = bootstrap.data?.capabilities.ai ?? true;

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader
        eyebrow="Cooking assistant"
        title="Plate"
        onBack
        compact
        right={
          <IconButton
            name="list"
            onPress={() => setHistoryOpen(true)}
            accessibilityLabel="Past conversations"
            size={40}
          />
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        {!conversationId || messages.isPending ? (
          <LoadingState label="Opening your conversation…" />
        ) : messages.isError ? (
          <ErrorState
            error={messages.error}
            fallback="This conversation could not load."
            onRetry={() => messages.refetch()}
          />
        ) : (
          <ScrollView
            ref={scroller}
            style={styles.flex}
            contentContainerStyle={styles.thread}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {list.length === 0 ? (
              <View style={styles.intro}>
                <EmptyState
                  icon="utensils"
                  title="Ask Plate anything"
                  description={
                    aiAvailable
                      ? 'Substitutions, timings, technique, or what to do with what is in your fridge. Send a photo if it is easier to show than describe.'
                      : 'This backend has no Gemini API key configured, so the assistant cannot reply yet.'
                  }
                />
                {aiAvailable ? (
                  <ChipWrap>
                    {STARTERS.map((starter) => (
                      <Chip key={starter} label={starter} onPress={() => send(starter)} />
                    ))}
                  </ChipWrap>
                ) : null}
              </View>
            ) : (
              list.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  speaking={voice.phase === 'speaking' && message.id === lastAssistant?.id}
                  onSpeak={
                    message.role === 'assistant' && voiceEnabled
                      ? () =>
                          voice.phase === 'speaking'
                            ? voice.stopSpeaking()
                            : voice.speak(message.content)
                      : undefined
                  }
                />
              ))
            )}

            {sendMessage.isPending ? (
              <Card style={styles.thinking}>
                <AppText variant="small" color="textSecondary">
                  Plate is thinking…
                </AppText>
              </Card>
            ) : null}
          </ScrollView>
        )}

        <View style={styles.indicator}>
          <VoiceIndicator
            state={assistantState}
            error={voice.error}
            onDismissError={voice.clearError}
          />
        </View>

        <Composer
          value={draft}
          onChangeText={setDraft}
          onSend={() => send(draft)}
          onPickPhoto={() => attach('library')}
          onTakePhoto={() => attach('camera')}
          onStartVoice={startVoice}
          onStopVoice={stopVoice}
          photo={photo}
          onClearPhoto={() => setPhoto(null)}
          listening={voice.phase === 'listening'}
          sending={sendMessage.isPending || voice.phase === 'transcribing'}
          voiceAvailable={voiceEnabled}
          disabled={!conversationId || !aiAvailable}
        />
      </KeyboardAvoidingView>

      <Sheet
        visible={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Your conversations"
        subtitle={
          voice.wakeWord && !voice.wakeWord.supported
            ? `Saying "${voice.wakeWord.phrase}" is not supported in this build — use the microphone button.`
            : undefined
        }>
        {conversations.isPending ? (
          <LoadingState compact />
        ) : (conversations.data ?? []).length === 0 ? (
          <AppText variant="small" color="textSecondary">
            You have no other conversations yet.
          </AppText>
        ) : (
          (conversations.data ?? []).map((conversation) => (
            <Card
              key={conversation.id}
              onPress={() => {
                setConversationId(conversation.id);
                setHistoryOpen(false);
              }}
              accessibilityLabel={conversation.title}>
              <View style={styles.historyRow}>
                <View style={styles.historyText}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {conversation.title}
                  </AppText>
                  <AppText variant="caption" color="textSecondary">
                    {conversation.messageCount} message
                    {conversation.messageCount === 1 ? '' : 's'}
                    {conversation.recipeTitle ? ` · ${conversation.recipeTitle}` : ''}
                  </AppText>
                </View>
                <IconButton
                  name="trash"
                  size={36}
                  variant="plain"
                  accessibilityLabel={`Delete ${conversation.title}`}
                  onPress={() => {
                    deleteConversation
                      .mutateAsync(conversation.id)
                      .then(() => {
                        if (conversation.id === conversationId) router.back();
                      })
                      .catch((error) =>
                        toast.showError(error, 'That conversation could not be deleted.')
                      );
                  }}
                />
              </View>
            </Card>
          ))
        )}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  thread: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two + 2,
  },
  intro: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.two,
  },
  thinking: {
    alignSelf: 'flex-start',
  },
  indicator: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  historyText: {
    flex: 1,
    gap: 2,
  },
});
