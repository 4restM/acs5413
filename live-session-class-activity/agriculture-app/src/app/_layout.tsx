import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { SQLiteProvider } from 'expo-sqlite';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

import { ScreenState } from '@/components/screen-state';
import { colors } from '@/constants/theme';
import { migrateDatabase } from '@/db/migrate';

const appTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background, card: colors.surface, text: colors.text, primary: colors.primary, border: colors.border },
};

export default function RootLayout() {
  const [databaseError, setDatabaseError] = useState<Error | null>(null);

  if (databaseError) {
    return (
      <SafeAreaView style={styles.errorScreen}>
        <ScreenState title="Farm data could not start" message={databaseError.message} tone="error" />
      </SafeAreaView>
    );
  }

  return (
    <ThemeProvider value={appTheme}>
      <SQLiteProvider databaseName="agriculture.db" onInit={migrateDatabase} onError={setDatabaseError}>
        <Stack screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.primaryDark, headerTitleStyle: { color: colors.text, fontWeight: '700' }, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="map" options={{ title: 'Farm Map' }} />
          <Stack.Screen name="inventory" options={{ title: 'Inventory' }} />
          <Stack.Screen name="rotation" options={{ title: 'Plant Rotation' }} />
          <Stack.Screen name="money" options={{ title: 'Money In / Out' }} />
          <Stack.Screen name="weather" options={{ title: 'Local Weather' }} />
        </Stack>
        <StatusBar style="dark" />
      </SQLiteProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  errorScreen: { flex: 1, backgroundColor: colors.background, padding: 16 },
});
