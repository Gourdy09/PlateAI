import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';

import { IconButton } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PickedPhoto } from '@/lib/photos';

/**
 * The chat input. Typing, a photo, and the microphone all lead to the same place:
 * a real message sent to the backend.
 */
export function Composer({
  value,
  onChangeText,
  onSend,
  onPickPhoto,
  onTakePhoto,
  onStartVoice,
  onStopVoice,
  photo,
  onClearPhoto,
  listening,
  sending,
  voiceAvailable,
  disabled = false,
  placeholder = 'Ask Plate anything about cooking',
}: {
  value: string;
  onChangeText: (next: string) => void;
  onSend: () => void;
  onPickPhoto: () => void;
  onTakePhoto: () => void;
  onStartVoice: () => void;
  onStopVoice: () => void;
  photo: PickedPhoto | null;
  onClearPhoto: () => void;
  listening: boolean;
  sending: boolean;
  voiceAvailable: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  const theme = useTheme();
  const [attachOpen, setAttachOpen] = useState(false);
  const canSend = Boolean(value.trim() || photo) && !sending && !disabled;

  return (
    <View style={[styles.wrap, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
      {photo ? (
        <View style={styles.attachment}>
          <Image source={{ uri: photo.uri }} style={styles.thumb} contentFit="cover" />
          <AppText variant="caption" color="textSecondary" style={styles.attachmentText}>
            Photo attached. Plate reads it to answer, and keeps only its description.
          </AppText>
          <IconButton
            name="close"
            size={32}
            variant="plain"
            onPress={onClearPhoto}
            accessibilityLabel="Remove photo"
          />
        </View>
      ) : null}

      <View style={styles.row}>
        <IconButton
          name="camera"
          size={44}
          onPress={() => setAttachOpen(true)}
          accessibilityLabel="Attach a photo"
          disabled={disabled || sending}
        />

        <View style={[styles.inputWrap, { backgroundColor: theme.input, borderColor: theme.inputBorder }]}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={listening ? 'Listening…' : placeholder}
            placeholderTextColor={theme.textTertiary}
            style={[styles.input, { color: theme.text }]}
            multiline
            editable={!disabled && !listening}
            onSubmitEditing={canSend ? onSend : undefined}
          />
        </View>

        {canSend ? (
          <IconButton
            name="send"
            size={48}
            variant="primary"
            onPress={onSend}
            accessibilityLabel="Send message"
            loading={sending}
          />
        ) : (
          <IconButton
            name={listening ? 'stop' : 'mic'}
            size={48}
            variant="primary"
            onPress={listening ? onStopVoice : onStartVoice}
            accessibilityLabel={listening ? 'Stop listening' : 'Hold a conversation with Plate'}
            disabled={disabled || sending || !voiceAvailable}
          />
        )}
      </View>

      {!voiceAvailable ? (
        <AppText variant="caption" color="textTertiary">
          Voice needs an ElevenLabs key on the server. Typing works either way.
        </AppText>
      ) : null}

      <Sheet
        visible={attachOpen}
        onClose={() => setAttachOpen(false)}
        title="Add a photo"
        subtitle="Plate looks at the photo to answer your question. The image itself is not saved."
        scrollable={false}>
        <IconButtonRow
          onCamera={() => {
            setAttachOpen(false);
            onTakePhoto();
          }}
          onLibrary={() => {
            setAttachOpen(false);
            onPickPhoto();
          }}
        />
      </Sheet>
    </View>
  );
}

function IconButtonRow({ onCamera, onLibrary }: { onCamera: () => void; onLibrary: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.attachRow}>
      <View style={styles.attachOption}>
        <IconButton
          name="camera"
          size={56}
          onPress={onCamera}
          accessibilityLabel="Take a photo"
          color={theme.primary}
        />
        <AppText variant="small">Camera</AppText>
      </View>
      <View style={styles.attachOption}>
        <IconButton
          name="image"
          size={56}
          onPress={onLibrary}
          accessibilityLabel="Choose from library"
          color={theme.primary}
        />
        <AppText variant="small">Library</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  inputWrap: {
    flex: 1,
    minHeight: 48,
    maxHeight: 132,
    justifyContent: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  input: {
    fontSize: 15,
    lineHeight: 21,
    maxHeight: 108,
  },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
  },
  attachmentText: {
    flex: 1,
  },
  attachRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: Spacing.two,
  },
  attachOption: {
    alignItems: 'center',
    gap: Spacing.two,
  },
});
