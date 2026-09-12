import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import {
  AuthCard,
  AuthField,
  AuthIntro,
  AuthScreen,
  BackToSignIn,
  PlateBrand,
  PrimaryButton,
} from '@/components/auth/auth-ui';
import { MailIcon } from '@/components/auth/icons';
import { useTheme } from '@/hooks/use-theme';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSend() {
    setSubmitting(true);
    try {
      // Wired for Auth0 password reset later; UI navigates to reset for now.
      await new Promise((r) => setTimeout(r, 400));
      Alert.alert('Reset link sent', 'Check your email, then choose a new password.');
      router.push('/(auth)/reset-password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen footer={<BackToSignIn onPress={() => router.replace('/(auth)/login')} />}>
      <PlateBrand />
      <AuthIntro
        eyebrow="A QUICK RESET"
        title="Forgot password?"
        description="No worries—we’ll send a fresh reset link to the email in your recipe box."
      />
      <AuthCard>
        <AuthField
          label="Email"
          leftIcon={<MailIcon size={18} color={theme.textSecondary} />}
          placeholder="chef@plate.app"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <PrimaryButton label="Send reset link" onPress={handleSend} disabled={submitting} />
      </AuthCard>
    </AuthScreen>
  );
}
