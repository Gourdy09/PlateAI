import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

import {
  AuthCard,
  AuthField,
  AuthIntro,
  AuthLinkRow,
  AuthScreen,
  PasswordVisibilityIcon,
  PlateBrand,
  PrimaryButton,
  SocialSignIn,
} from '@/components/auth/auth-ui';
import { LockIcon, MailIcon } from '@/components/auth/icons';
import { useAuth } from '@/ctx/auth';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const theme = useTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Enter email and password to sign in.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (error) {
      Alert.alert('Sign in failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      footer={
        <>
          <SocialSignIn
            onApple={() => Alert.alert('Coming soon', 'Apple sign-in will use Auth0 next.')}
            onGoogle={() => Alert.alert('Coming soon', 'Google sign-in will use Auth0 next.')}
          />
          <AuthLinkRow
            prompt="New to Plate?"
            action="Create account"
            onPress={() => router.push('/(auth)/signup')}
          />
        </>
      }>
      <PlateBrand />
      <AuthIntro
        eyebrow="WELCOME BACK, CHEF"
        title="Ready to cook?"
        description="Sign in to save recipes and keep your kitchen inspiration simmering."
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
        <AuthField
          label="Password"
          leftIcon={<LockIcon size={18} color={theme.textSecondary} />}
          placeholder="At least 8 characters"
          secureTextEntry={!showPassword}
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
          rightIcon={<PasswordVisibilityIcon visible={showPassword} />}
          onPressRight={() => setShowPassword((v) => !v)}
        />
        <Pressable
          onPress={() => router.push('/(auth)/forgot-password')}
          accessibilityRole="link"
          style={styles.forgot}>
          <Text style={[styles.forgotText, { color: theme.primary }]}>Forgot password?</Text>
        </Pressable>
        <PrimaryButton label="Sign in" onPress={handleSignIn} disabled={submitting} />
      </AuthCard>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  forgot: {
    alignSelf: 'stretch',
  },
  forgotText: {
    fontSize: 13,
    textAlign: 'right',
  },
});
