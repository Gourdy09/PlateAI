import { type ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppleIcon,
  ArrowLeftCircle,
  ArrowRightCircle,
  EyeIcon,
  EyeOffIcon,
  GoogleIcon,
  UtensilsCrossed,
} from '@/components/auth/icons';
import { Plate, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function AuthScreen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const theme = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View
        pointerEvents="none"
        style={[styles.herbWash, { backgroundColor: Plate.herbWash, opacity: 0.48 }]}
      />
      <View
        pointerEvents="none"
        style={[styles.spiceWash, { backgroundColor: Plate.spiceWash, opacity: 0.5 }]}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior="padding"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets
            contentInsetAdjustmentBehavior="automatic">
            <View style={styles.main}>{children}</View>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export function PlateBrand() {
  const theme = useTheme();
  return (
    <View style={styles.brand}>
      <Image
        source={require('@/assets/images/plate-logo-cream-on-terracotta.png')}
        style={styles.logoImage}
        accessibilityLabel="Plate logo"
      />
      <Text style={[styles.wordmark, { color: theme.text }]}>Plate</Text>
    </View>
  );
}

export function AuthIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.intro}>
      <View style={styles.eyebrow}>
        <UtensilsCrossed size={15} color={theme.primary} />
        <Text style={[styles.eyebrowText, { color: theme.primary }]}>{eyebrow}</Text>
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>{description}</Text>
    </View>
  );
}

export function AuthCard({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          shadowColor: '#6b3b20',
        },
      ]}>
      {children}
    </View>
  );
}

export function AuthField({
  label,
  leftIcon,
  rightIcon,
  onPressRight,
  ...inputProps
}: {
  label: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onPressRight?: () => void;
} & TextInputProps) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          { backgroundColor: theme.input, borderColor: theme.inputBorder },
        ]}>
        {leftIcon}
        <TextInput
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
          {...inputProps}
        />
        {rightIcon ? (
          <Pressable onPress={onPressRight} hitSlop={8} accessibilityRole="button">
            {rightIcon}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function PasswordVisibilityIcon({ visible }: { visible: boolean }) {
  const theme = useTheme();
  return visible ? (
    <EyeIcon size={18} color={theme.textSecondary} />
  ) : (
    <EyeOffIcon size={18} color={theme.textSecondary} />
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        { opacity: disabled ? 0.6 : pressed ? 0.9 : 1 },
      ]}>
      <Text style={styles.primaryLabel}>{label}</Text>
      <ArrowRightCircle size={18} color="#ffffff" />
    </Pressable>
  );
}

export function SocialSignIn({
  onApple,
  onGoogle,
}: {
  onApple: () => void;
  onGoogle: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.socialBlock}>
      <View style={styles.dividerRow}>
        <View style={[styles.rule, { backgroundColor: theme.divider }]} />
        <Text style={[styles.dividerLabel, { color: theme.textSecondary }]}>OR CONTINUE WITH</Text>
        <View style={[styles.rule, { backgroundColor: theme.divider }]} />
      </View>
      <View style={styles.socialRow}>
        <Pressable
          onPress={onApple}
          style={[styles.socialButton, { borderColor: theme.inputBorder }]}>
          <AppleIcon size={18} color={theme.text} />
          <Text style={[styles.socialLabel, { color: theme.text }]}>Apple</Text>
        </Pressable>
        <Pressable
          onPress={onGoogle}
          style={[styles.socialButton, { borderColor: theme.inputBorder }]}>
          <GoogleIcon size={18} />
          <Text style={[styles.socialLabel, { color: theme.text }]}>Google</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function AuthLinkRow({
  prompt,
  action,
  onPress,
}: {
  prompt: string;
  action: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.linkRow} accessibilityRole="link">
      <Text style={[styles.linkPrompt, { color: theme.textSecondary }]}>
        {prompt}{' '}
        <Text style={[styles.linkAction, { color: theme.primary }]}>{action}</Text>
      </Text>
    </Pressable>
  );
}

export function BackToSignIn({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.backRow} accessibilityRole="link">
      <ArrowLeftCircle size={16} color={theme.primary} />
      <Text style={[styles.backLabel, { color: theme.primary }]}>Back to sign in</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  herbWash: {
    position: 'absolute',
    top: 72,
    right: -34,
    width: 138,
    height: 138,
    borderRadius: 69,
  },
  spiceWash: {
    position: 'absolute',
    bottom: 100,
    left: -56,
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    justifyContent: 'space-between',
    gap: Spacing.four,
  },
  main: {
    gap: Spacing.four,
  },
  footer: {
    gap: 18,
    alignItems: 'center',
    paddingBottom: Spacing.two,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
  },
  wordmark: {
    fontSize: 22,
    fontWeight: '400',
  },
  intro: {
    gap: 9,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 30,
    lineHeight: 33,
    fontWeight: '400',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderRadius: Radius.lg,
    padding: 18,
    gap: Spacing.three,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.09,
    shadowRadius: 40,
    elevation: 4,
  },
  field: {
    gap: Spacing.two,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputRow: {
    height: 54,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  primaryButton: {
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Plate.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  socialBlock: {
    width: '100%',
    gap: Spacing.three,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerLabel: {
    fontSize: 12,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  linkRow: {
    alignItems: 'center',
  },
  linkPrompt: {
    fontSize: 14,
  },
  linkAction: {
    fontWeight: '700',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  backLabel: {
    fontSize: 14,
  },
});
