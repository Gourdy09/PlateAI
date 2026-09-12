import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeIcon, type HomeAssetName } from '@/components/home/home-icon';
import { useTheme } from '@/hooks/use-theme';

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
};

export function PlateTabBar({ state, navigation }: TabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const tabs = (
    <>
      {(['cart', 'camera', 'index', 'you'] as const).map((name) => {
        if (name === 'camera') {
          return <View key="camera-gap" style={styles.cameraGap} />;
        }
        const route = state.routes.find((item) => item.name === name);
        if (!route) return <View key={name} style={styles.slot} />;
        const focused = state.index === state.routes.indexOf(route);
        const icon: HomeAssetName = name === 'cart' ? 'cart' : name === 'you' ? 'user' : 'home';
        const label = name === 'cart' ? 'Cart' : name === 'you' ? 'You' : 'Home';
        return (
          <Pressable
            key={name}
            style={styles.slot}
            onPress={() => navigation.navigate(route.name)}
            accessibilityRole="button"
            accessibilityLabel={label}>
            <HomeIcon name={icon} color={focused ? theme.sage : theme.chipText} />
            <Text
              style={[
                styles.label,
                {
                  color: focused ? theme.sage : theme.chipText,
                  fontWeight: focused ? '700' : '500',
                },
              ]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </>
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.liftRow}>
        <View style={styles.slot} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open camera"
          onPress={() => router.push('/(app)/camera')}
          style={[styles.camera, { backgroundColor: theme.sage }]}>
          <HomeIcon name="camera" />
        </Pressable>
        <View style={styles.slot} />
        <View style={styles.slot} />
      </View>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: theme.card,
            borderTopColor: theme.filterBorder,
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ]}>
        <View style={styles.inner}>{tabs}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'visible',
  },
  liftRow: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    overflow: 'visible',
  },
  bar: {
    borderTopWidth: 1,
  },
  inner: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    height: 80,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 12,
  },
  camera: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#78927b',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  cameraGap: {
    width: 60,
  },
  slot: {
    width: 70,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
  },
});
