import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/ctx/auth';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function HomeScreen() {
  const theme = useTheme();
  const { signOut, session } = useAuth();
  const user = session?.user;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.center}>
        <Text style={[styles.title, { color: theme.text }]}>home</Text>
        {user?.picture ? (
          <Image source={{ uri: user.picture }} style={styles.avatar} accessibilityLabel="Profile" />
        ) : null}
        <Text style={[styles.name, { color: theme.text }]}>{user?.name}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{user?.email}</Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>{user?.id}</Text>
        <Pressable onPress={signOut} style={[styles.button, { borderColor: theme.inputBorder }]}>
          <Text style={{ color: theme.primary, fontWeight: '600' }}>Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    textTransform: 'lowercase',
    marginBottom: Spacing.two,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: Spacing.one,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
  },
  meta: {
    fontSize: 11,
    opacity: 0.8,
  },
  button: {
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
  },
});
