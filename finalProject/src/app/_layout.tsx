import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { IdentityProvider, useIdentity } from '@/context/identity-context';

const mtgNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    border: colors.border,
    card: colors.surface,
    notification: colors.danger,
    primary: colors.accent,
    text: colors.text,
  },
};

function AppNavigator() {
  const { handle, isLoading, bootstrapError } = useIdentity();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>Preparing your trade binder…</Text>
      </View>
    );
  }

  if (bootstrapError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Identity setup failed</Text>
        <Text style={styles.errorMessage}>{bootstrapError}</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={!handle}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(handle)}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={mtgNavigationTheme}>
      <IdentityProvider>
        <AppNavigator />
      </IdentityProvider>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  errorMessage: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 23,
    marginTop: 8,
    textAlign: 'center',
  },
  errorTitle: {
    color: colors.danger,
    fontSize: 20,
    fontWeight: '700',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 16,
  },
});
