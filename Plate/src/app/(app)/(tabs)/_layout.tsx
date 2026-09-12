import { Tabs } from 'expo-router';

import { PlateTabBar } from '@/components/home/plate-tab-bar';

export default function AppTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <PlateTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="cart" options={{ title: 'Cart' }} />
      <Tabs.Screen name="you" options={{ title: 'You' }} />
    </Tabs>
  );
}
