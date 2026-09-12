import { useState } from 'react';
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

export default function SignUpScreen() {
  const theme = useTheme();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    setSubmitting(true);
    try {
      await signUp(name || 'Chef', email || 'chef@plate.app');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      footer={
        <>
          <SocialSignIn
            onApple={() => signUp('Apple Chef', 'apple@plate.app')}
            onGoogle={() => signUp('Google Chef', 'google@plate.app')}
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
