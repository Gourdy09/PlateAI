import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { Elevation, Fill, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Bottom sheet used for filters, pickers, and short forms. */
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  scrollable = true,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scrollable?: boolean;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          style={[styles.scrim, { backgroundColor: theme.scrim }]}
          onPress={onClose}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}>
          <View
            style={[
              styles.sheet,
              Elevation.raised,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                paddingBottom: Math.max(insets.bottom, Spacing.four),
              },
            ]}>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <AppText variant="heading">{title}</AppText>
                {subtitle ? (
                  <AppText variant="small" color="textSecondary">
                    {subtitle}
                  </AppText>
                ) : null}
              </View>
              <IconButton name="close" onPress={onClose} accessibilityLabel="Close" size={38} />
            </View>

            {scrollable ? (
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled">
                {children}
              </ScrollView>
            ) : (
              <View style={styles.scrollContent}>{children}</View>
            )}

            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...Fill,
  },
  keyboard: {
    width: '100%',
  },
  sheet: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    maxHeight: '88%',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: Spacing.three,
    paddingBottom: Spacing.two,
  },
  footer: {
    gap: Spacing.two,
  },
});
