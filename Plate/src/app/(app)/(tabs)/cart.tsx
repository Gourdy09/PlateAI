import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeIcon } from '@/components/home/home-icon';
import { useTheme } from '@/hooks/use-theme';

export default function CartScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.center}>
        <HomeIcon name="cart" width={32} height={32} />
        <Text style={[styles.title, { color: theme.text }]}>Cart</Text>
        <Text style={[styles.copy, { color: theme.chipText }]}>
          Saved groceries for tonight’s plate will land here.
        </Text>
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
  title: { fontSize: 28, fontWeight: '800' },
  copy: { fontSize: 14, textAlign: 'center' },
});
