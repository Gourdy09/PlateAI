import { Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="recipe/[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="cook/[sessionId]" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="chat" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="fridge" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="preferences" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="history" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="generate" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
