import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="recipe" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="camera" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
    </Stack>
  );
}
