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

const HOME = '/(app)/(tabs)' as const;

export default function LoginScreen() {
  const theme = useTheme();
  const { signIn, signInWithApple, signInWithGoogle, signInAsGuest } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function goHomeAfterAuth(run: () => Promise<{ user: { id: string }; tokens: { accessToken: string } }>) {
    setSubmitting(true);
    try {
      const session = await run();
      if (!session.tokens.accessToken || !session.user.id) {
        throw new Error('Sign in did not complete. Please try again.');
      }
      router.replace(HOME);
    } catch (error) {
      Alert.alert('Sign in failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignIn() {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Enter email and password to sign in.');
      return;
    }
    await goHomeAfterAuth(() => signIn(email, password));
  }

  async function handleSocial(provider: 'apple' | 'google') {
    await goHomeAfterAuth(() => (provider === 'apple' ? signInWithApple() : signInWithGoogle()));
  }

  async function handleGuest() {
    await goHomeAfterAuth(() => signInAsGuest());
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
          placeholder="Your Auth0 password"
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
        {__DEV__ ? (
          <Pressable
            onPress={handleGuest}
            accessibilityRole="button"
            style={[styles.devButton, { borderColor: theme.inputBorder }]}>
            <Text style={[styles.devButtonText, { color: theme.textSecondary }]}>
              Continue as guest (dev)
            </Text>
          </Pressable>
        ) : null}
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
  devButton: {
    marginTop: 4,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  devButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
