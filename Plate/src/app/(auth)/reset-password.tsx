import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import {
  AuthCard,
  AuthIntro,
  AuthScreen,
  BackToSignIn,
  PlateBrand,
  PrimaryButton,
} from '@/components/auth/auth-ui';

export default function ResetPasswordScreen() {
  return (
    <AuthScreen footer={<BackToSignIn onPress={() => router.replace('/(auth)/login')} />}>
      <PlateBrand />
      <AuthIntro
        eyebrow="CHECK YOUR INBOX"
        title="Reset from email"
        description="Open the Auth0 reset link we emailed you. After you set a new password there, come back and sign in."
      />
      <AuthCard>
        <View style={styles.body}>
          <Text style={styles.copy}>
            Password resets are handled securely by Auth0. Use the link in your email — then sign in
            with your new password.
          </Text>
        </View>
        <PrimaryButton label="Back to sign in" onPress={() => router.replace('/(auth)/login')} />
      </AuthCard>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: 8,
  },
  copy: {
    fontSize: 14,
    lineHeight: 20,
    color: '#776f66',
  },
});
