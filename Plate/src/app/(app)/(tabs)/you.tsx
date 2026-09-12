import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeIcon } from '@/components/home/home-icon';
import { useAuth } from '@/ctx/auth';
import { useTheme } from '@/hooks/use-theme';

export default function YouScreen() {
  const theme = useTheme();
  const { signOut, session } = useAuth();
  const user = session?.user;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.center}>
        <View style={[styles.avatar, { backgroundColor: theme.sage }]}>
          <HomeIcon name="user" />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{user?.name || 'You'}</Text>
        <Text style={[styles.copy, { color: theme.chipText }]}>{user?.email}</Text>
        <Pressable
          onPress={signOut}
          style={[styles.button, { borderColor: theme.filterBorder }]}
          accessibilityRole="button">
          <Text style={{ color: theme.primary, fontWeight: '600' }}>Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: '800' },
  copy: { fontSize: 14, textAlign: 'center' },
  button: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
});
