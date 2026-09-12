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
import { useAuth } from '@/ctx/auth';
import { useTheme } from '@/hooks/use-theme';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSend() {
    if (!email.trim()) {
      Alert.alert('Email required', 'Enter the email on your Plate account.');
      return;
    }
    setSubmitting(true);
    try {
      const message = await resetPassword(email);
      Alert.alert('Reset link sent', message, [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (error) {
      Alert.alert('Could not send link', error instanceof Error ? error.message : 'Try again.');
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
        description="No worries—we’ll email a reset link from Auth0 to the address in your recipe box."
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
