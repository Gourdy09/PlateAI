import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeIcon, type HomeAssetName } from '@/components/home/home-icon';
import { useTheme } from '@/hooks/use-theme';

export const TAB_BAR_CONTENT_HEIGHT = 64;

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
};

const TABS: { name: string; label: string; icon: HomeAssetName }[] = [
  { name: 'index', label: 'Home', icon: 'home' },
  { name: 'cart', label: 'Cart', icon: 'cart' },
  { name: 'you', label: 'You', icon: 'user' },
];

export function PlateTabBar({ state, navigation }: TabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.card,
          borderTopColor: theme.filterBorder,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}>
      <View style={styles.inner}>
        {TABS.map((tab) => {
          const route = state.routes.find((item) => item.name === tab.name);
          if (!route) return <View key={tab.name} style={styles.slot} />;
          const focused = state.index === state.routes.indexOf(route);
          return (
            <Pressable
              key={tab.name}
              style={styles.slot}
              onPress={() => navigation.navigate(route.name)}
              accessibilityRole="button"
              accessibilityLabel={tab.label}>
              <HomeIcon name={tab.icon} color={focused ? theme.sage : theme.chipText} />
              <Text
                style={[
                  styles.label,
                  {
                    color: focused ? theme.sage : theme.chipText,
                    fontWeight: focused ? '700' : '500',
                  },
                ]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inner: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    height: TAB_BAR_CONTENT_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
  },
});
