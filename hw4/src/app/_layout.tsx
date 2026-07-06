import { Stack } from 'expo-router';

// stack screen dynamic with [], headerShown disabled so all components render at the same time.
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Home' }} />
      <Stack.Screen name="[appId]" options={{ headerShown: false }} /> 
    </Stack>
  );
}
