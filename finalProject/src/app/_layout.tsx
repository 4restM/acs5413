import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { BinderProvider } from '@/context/binder-context';
import { IdentityProvider, useIdentity } from '@/context/identity-context';
import { StoreProvider } from '@/context/store-context';
import { TradeProvider } from '@/context/trade-context';
import { initializeCardCache } from '@/lib/card-cache';
import { getErrorMessage } from '@/lib/errors';
import { configureNotifications } from '@/lib/notifications';

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
  const [cacheIsLoading, setCacheIsLoading] = useState(true);
  const [cacheError, setCacheError] = useState<string | null>(null);

  useEffect(() => {
    initializeCardCache()
      .catch((error: unknown) => {
        console.error('Card cache setup failed:', error);
        setCacheError(getErrorMessage(error, 'The card cache could not be opened.'));
      })
      .finally(() => setCacheIsLoading(false));
  }, []);

  useEffect(() => {
    configureNotifications().catch((error: unknown) => {
      console.warn('Notification setup failed:', error);
    });
  }, []);

  if (isLoading || cacheIsLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>Preparing your trade binder…</Text>
      </View>
    );
  }

  const startupError = bootstrapError || cacheError;
  if (startupError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>App setup failed</Text>
        <Text style={styles.errorMessage}>{startupError}</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Protected guard={!handle}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(handle)}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="import"
          options={{ presentation: 'modal', title: 'Import cards' }}
        />
        <Stack.Screen name="card/[cardKey]" options={{ title: 'Card details' }} />
        <Stack.Screen name="match/[partnerUid]" options={{ title: 'Trade match' }} />
        <Stack.Screen
          name="log-trade"
          options={{ presentation: 'modal', title: 'Log trade' }}
        />
        <Stack.Screen
          name="add-store"
          options={{ presentation: 'modal', title: 'Add store' }}
        />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={mtgNavigationTheme}>
      <IdentityProvider>
        <BinderProvider>
          <StoreProvider>
            <TradeProvider>
              <AppNavigator />
            </TradeProvider>
          </StoreProvider>
        </BinderProvider>
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
    fontWeight: '500',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 16,
  },
});
