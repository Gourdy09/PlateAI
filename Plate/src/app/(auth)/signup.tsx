import { useState } from 'react';
import { Alert } from 'react-native';
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
import { LockIcon, MailIcon, UserIcon } from '@/components/auth/icons';
import { useAuth } from '@/ctx/auth';
import { useTheme } from '@/hooks/use-theme';

const HOME = '/(app)/(tabs)' as const;

export default function SignUpScreen() {
  const theme = useTheme();
  const { signUp, signInWithApple, signInWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function goHomeAfterAuth(run: () => Promise<{ user: { id: string }; tokens: { accessToken: string } }>) {
    setSubmitting(true);
    try {
      const session = await run();
      if (!session.tokens.accessToken || !session.user.id) {
        throw new Error('Account was not signed in. Please try again.');
      }
      router.replace(HOME);
    } catch (error) {
      Alert.alert('Sign up failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreate() {
    if (!name.trim() || !email.trim() || password.length < 8) {
      Alert.alert('Check your details', 'Name, email, and an 8+ character password are required.');
      return;
    }
    await goHomeAfterAuth(() => signUp(name, email, password));
  }

  async function handleSocial(provider: 'apple' | 'google') {
    await goHomeAfterAuth(() => (provider === 'apple' ? signInWithApple() : signInWithGoogle()));
  }

  return (
    <AuthScreen
      footer={
        <>
          <SocialSignIn
            onApple={() => handleSocial('apple')}
            onGoogle={() => handleSocial('google')}
          />
          <AuthLinkRow
            prompt="Already have an account?"
            action="Sign in"
            onPress={() => router.replace('/(auth)/login')}
          />
        </>
      }>
      <PlateBrand />
      <AuthIntro
        eyebrow="JOIN THE TABLE"
        title="Create your Plate"
        description="Collect recipes, plan delicious meals, and make every bite count."
      />
      <AuthCard>
        <AuthField
          label="Name"
          leftIcon={<UserIcon size={18} color={theme.textSecondary} />}
          placeholder="Your name"
          autoComplete="name"
          value={name}
          onChangeText={setName}
        />
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
          autoComplete="new-password"
          value={password}
          onChangeText={setPassword}
          rightIcon={<PasswordVisibilityIcon visible={showPassword} />}
          onPressRight={() => setShowPassword((v) => !v)}
        />
        <PrimaryButton label="Create account" onPress={handleCreate} disabled={submitting} />
      </AuthCard>
    </AuthScreen>
  );
}
