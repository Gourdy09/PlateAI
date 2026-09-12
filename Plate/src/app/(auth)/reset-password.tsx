import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import {
  AuthCard,
  AuthField,
  AuthIntro,
  AuthScreen,
  BackToSignIn,
  PasswordVisibilityIcon,
  PlateBrand,
  PrimaryButton,
} from '@/components/auth/auth-ui';
import { CheckCircleIcon, LockIcon, UserCheckIcon } from '@/components/auth/icons';
import { useTheme } from '@/hooks/use-theme';

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isStrong = useMemo(() => password.length >= 8 && /\d/.test(password), [password]);

  async function handleReset() {
    if (!isStrong) {
      Alert.alert('Weak password', 'Use 8+ characters with a number.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      Alert.alert('Password updated', 'Use your new password on the sign in screen.');
      router.replace('/(auth)/login');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen footer={<BackToSignIn onPress={() => router.replace('/(auth)/login')} />}>
      <PlateBrand />
      <AuthIntro
        eyebrow="ALMOST THERE"
        title="Reset password"
        description="Choose a strong new password, then get right back to cooking."
      />
      <AuthCard>
        <AuthField
          label="New password"
          leftIcon={<LockIcon size={18} color={theme.textSecondary} />}
          placeholder="At least 8 characters"
          secureTextEntry={!showPassword}
          autoComplete="new-password"
          value={password}
          onChangeText={setPassword}
          rightIcon={<PasswordVisibilityIcon visible={showPassword} />}
          onPressRight={() => setShowPassword((v) => !v)}
        />
        <AuthField
          label="Confirm password"
          leftIcon={<UserCheckIcon size={18} color={theme.textSecondary} />}
          placeholder="Repeat new password"
          secureTextEntry={!showConfirm}
          autoComplete="new-password"
          value={confirm}
          onChangeText={setConfirm}
          rightIcon={<PasswordVisibilityIcon visible={showConfirm} />}
          onPressRight={() => setShowConfirm((v) => !v)}
        />
        <View style={styles.guidance}>
          <CheckCircleIcon size={15} color={isStrong ? '#3F8F5B' : theme.textSecondary} />
          <Text style={[styles.guidanceText, { color: theme.textSecondary }]}>
            8+ characters with a number
          </Text>
        </View>
        <PrimaryButton label="Set new password" onPress={handleReset} disabled={submitting} />
      </AuthCard>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  guidance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guidanceText: {
    fontSize: 12,
  },
});
