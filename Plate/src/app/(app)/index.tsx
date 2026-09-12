import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/ctx/auth';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function HomeScreen() {
  const theme = useTheme();
  const { signOut, session } = useAuth();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.center}>
        <Text style={[styles.title, { color: theme.text }]}>home</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{session}</Text>
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
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  subtitle: {
    fontSize: 14,
  },
  button: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
  },
});
