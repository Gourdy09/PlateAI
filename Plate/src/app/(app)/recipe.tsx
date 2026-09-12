import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';

import { getDish } from '@/components/home/dishes';
import { HomeIcon } from '@/components/home/home-icon';
import { Plate, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};

function MicIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="2" width="6" height="11" rx="3" stroke={color} strokeWidth={1.8} />
      <Path
        d="M5 11a7 7 0 0 0 14 0"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path d="M12 18v3" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function SendIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12h14M13 6l6 6-6 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function RecipeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const dish = getDish(id ?? 'quinoa');
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [draft, setDraft] = useState('');
  const [listening, setListening] = useState(false);

  const seed = useMemo<ChatMessage[]>(
    () => [
      {
        id: 'a1',
        role: 'assistant',
        text: `I pulled up ${dish.name}. It's about ${dish.minutes} minutes, rates ${dish.rating.toFixed(1)}★, and runs ${dish.spice.toLowerCase()} on spice.`,
      },
      {
        id: 'a2',
        role: 'assistant',
        text: `I can suggest ingredient swaps from your Personalize Feed and settings once AI substitutions are wired. Ask me anything about nutrition, method, or swaps.`,
      },
    ],
    [dish],
  );

  const [messages, setMessages] = useState<ChatMessage[]>(seed);

  useEffect(() => {
    setMessages(seed);
  }, [seed]);

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const assistantMessage: ChatMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      text: `Got it — “${trimmed}”. When scraping + preference-based substitutions are live, I’ll reshape ${dish.name} around that. For now I’m ready to talk through the current ingredients and method.`,
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setDraft('');
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={[styles.header, { borderBottomColor: theme.inputBorder }]}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.back, { backgroundColor: theme.card }]}
            accessibilityRole="button"
            accessibilityLabel="Back">
            <HomeIcon name="arrow_left" />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={[styles.headerEyebrow, { color: theme.primary }]}>RECIPE CHAT</Text>
            <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
              {dish.name}
            </Text>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.thread}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const mine = item.role === 'user';
              return (
                <View
                  style={[
                    styles.bubbleRow,
                    mine ? styles.bubbleRowMine : styles.bubbleRowAi,
                  ]}>
                  <View
                    style={[
                      styles.bubble,
                      mine
                        ? { backgroundColor: Plate.primary }
                        : { backgroundColor: theme.card, shadowColor: '#6b3b20' },
                    ]}>
                    <Text style={[styles.bubbleText, { color: mine ? '#ffffff' : theme.text }]}>
                      {item.text}
                    </Text>
                  </View>
                </View>
              );
            }}
          />

          <View
            style={[
              styles.composerWrap,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}>
            <View
              style={[
                styles.composer,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.inputBorder,
                  shadowColor: '#6b3b20',
                },
              ]}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Ask about swaps, macros, steps…"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text }]}
                multiline
                onSubmitEditing={() => sendMessage(draft)}
                blurOnSubmit={false}
              />
              <Pressable
                onPress={() => {
                  setListening((value) => !value);
                }}
                style={[
                  styles.iconBtn,
                  {
                    backgroundColor: listening ? Plate.primary : theme.chip,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Voice input">
                <MicIcon color={listening ? '#ffffff' : theme.textSecondary} />
              </Pressable>
              <Pressable
                onPress={() => sendMessage(draft)}
                style={[styles.iconBtn, { backgroundColor: Plate.primary }]}
                accessibilityRole="button"
                accessibilityLabel="Send message">
                <SendIcon color="#ffffff" />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  thread: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 12,
  },
  bubbleRow: {
    width: '100%',
  },
  bubbleRowAi: {
    alignItems: 'flex-start',
  },
  bubbleRowMine: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  composerWrap: {
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  composer: {
    minHeight: 56,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingLeft: 18,
    paddingRight: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 8,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    fontSize: 15,
    lineHeight: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
