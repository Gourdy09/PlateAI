import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeIcon } from '@/components/home/home-icon';
import { useTheme } from '@/hooks/use-theme';

export default function CameraScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.center}>
        <View style={[styles.lens, { backgroundColor: theme.sage }]}>
          <HomeIcon name="camera" />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Camera</Text>
        <Text style={[styles.copy, { color: theme.chipText }]}>
          Point at a plate to identify ingredients. Capture is coming next.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.button, { borderColor: theme.filterBorder }]}
          accessibilityRole="button"
          accessibilityLabel="Close">
          <Text style={{ color: theme.primary, fontWeight: '600' }}>Close</Text>
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
  },
  lens: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
