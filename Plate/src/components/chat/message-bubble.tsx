import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ChatMessage } from '@/api/types';

/**
 * A single turn in the conversation. Photos are described, not stored, so a user
 * message with an image shows the summary Plate actually worked from.
 */
export function MessageBubble({
  message,
  onSpeak,
  speaking = false,
}: {
  message: ChatMessage;
  onSpeak?: () => void;
  speaking?: boolean;
}) {
  const theme = useTheme();
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View
        style={[
          styles.bubble,
          isUser
            ? { backgroundColor: theme.primary, borderBottomRightRadius: Radius.xs }
            : {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: StyleSheet.hairlineWidth,
                borderBottomLeftRadius: Radius.xs,
              },
        ]}>
        {message.messageType === 'voice' && isUser ? (
          <View style={styles.tag}>
            <Icon name="mic" size={12} color={theme.onPrimary} />
            <AppText variant="caption" tint={theme.onPrimary}>
              Voice
            </AppText>
          </View>
        ) : null}

        <AppText variant="body" tint={isUser ? theme.onPrimary : theme.text}>
          {message.content}
        </AppText>

        {message.imageSummary ? (
          <View style={[styles.photoNote, { borderTopColor: theme.divider }]}>
            <Icon name="image" size={13} color={isUser ? theme.onPrimary : theme.textSecondary} />
            <AppText
              variant="caption"
              tint={isUser ? theme.onPrimary : theme.textSecondary}
              style={styles.photoText}>
              {message.imageSummary}
            </AppText>
          </View>
        ) : null}
      </View>

      {!isUser && onSpeak ? (
        <IconButton
          name={speaking ? 'stop' : 'speaker'}
          size={34}
          variant="plain"
          color={theme.textSecondary}
          onPress={onSpeak}
          accessibilityLabel={speaking ? 'Stop speaking' : 'Read this reply aloud'}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  rowUser: {
    justifyContent: 'flex-end',
    paddingLeft: Spacing.five,
  },
  rowAssistant: {
    justifyContent: 'flex-start',
    paddingRight: Spacing.three,
  },
  bubble: {
    flexShrink: 1,
    maxWidth: '92%',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    borderRadius: Radius.lg,
    gap: Spacing.one,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    opacity: 0.85,
  },
  photoNote: {
    flexDirection: 'row',
    gap: 6,
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    opacity: 0.9,
  },
  photoText: {
    flex: 1,
  },
});
