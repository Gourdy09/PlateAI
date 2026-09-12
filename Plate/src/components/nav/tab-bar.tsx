import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useBootstrap } from '@/api/use-account';

export const TAB_BAR_CONTENT_HEIGHT = 64;

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
};

const TABS: { name: string; label: string; icon: IconName }[] = [
  { name: 'index', label: 'Discover', icon: 'home' },
  { name: 'saved', label: 'Saved', icon: 'heart' },
  { name: 'cart', label: 'Cart', icon: 'cart' },
  { name: 'you', label: 'You', icon: 'user' },
];

export function PlateTabBar({ state, navigation }: TabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { data: bootstrap } = useBootstrap();

  // Real counts from MongoDB; the badge is hidden when there is nothing to show.
  const badges: Record<string, number> = {
    cart: bootstrap?.stats.cartItems ?? 0,
    saved: bootstrap?.stats.savedRecipes ?? 0,
  };

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.navigation,
          borderTopColor: theme.navigationBorder,
          paddingBottom: Math.max(insets.bottom, Spacing.two),
        },
      ]}>
      <View style={styles.inner}>
        {TABS.map((tab) => {
          const route = state.routes.find((item) => item.name === tab.name);
          if (!route) return <View key={tab.name} style={styles.slot} />;

          const focused = state.index === state.routes.indexOf(route);
          const tint = focused ? theme.primary : theme.textSecondary;
          const badge = badges[tab.name] ?? 0;

          return (
            <Pressable
              key={tab.name}
              style={styles.slot}
              onPress={() => navigation.navigate(route.name)}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}>
              <View>
                <Icon name={tab.icon} size={22} color={tint} filled={focused && tab.icon === 'heart'} />
                {badge > 0 ? (
                  <View style={[styles.badge, { backgroundColor: theme.primary, borderColor: theme.navigation }]}>
                    <AppText variant="caption" tint={theme.onPrimary} style={styles.badgeText}>
                      {badge > 99 ? '99+' : badge}
                    </AppText>
                  </View>
                ) : null}
              </View>
              <AppText variant="caption" tint={tint} style={focused ? styles.labelActive : undefined}>
                {tab.label}
              </AppText>
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
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    height: TAB_BAR_CONTENT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  labelActive: {
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
  },
});
