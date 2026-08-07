import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InlineNotice } from '@/components/inline-notice';
import { StatTile } from '@/components/stat-tile';
import { colors, radii, spacing, typeScale } from '@/constants/theme';
import { useBinder } from '@/context/binder-context';
import { useIdentity } from '@/context/identity-context';
import { useStores } from '@/context/store-context';

export default function HomeScreen() {
  const { handle, homeStoreId, resetRecordingState } = useIdentity();
  const [isResetting, setIsResetting] = useState(false);
  const {
    haves,
    wants,
    isLoading: binderIsLoading,
    errorMessage: binderError,
    refresh: refreshBinder,
  } = useBinder();
  const {
    stores,
    isLoading: storesAreLoading,
    errorMessage: storeError,
    refresh: refreshStores,
  } = useStores();
  const haveQuantity = haves.reduce((total, card) => total + card.qty, 0);
  const wantQuantity = wants.reduce((total, card) => total + card.qty, 0);
  const homeStore = stores.find((store) => store.id === homeStoreId);
  const errors = [...new Set([binderError, storeError].filter(Boolean))] as string[];
  const isRefreshing = binderIsLoading || storesAreLoading;

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshBinder(), refreshStores()]);
  }, [refreshBinder, refreshStores]);

  function openImport(listKind: 'haves' | 'wants') {
    router.push({ pathname: '/import', params: { listKind } });
  }

  function openBinder(listKind: 'haves' | 'wants') {
    router.push({ pathname: '/binder', params: { listKind } });
  }

  function confirmRecordingReset() {
    Alert.alert(
      'Reset local recording state?',
      'This creates a new device UUID and returns to handle setup. Firebase records, permissions, and the card cache are not deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            try {
              await resetRecordingState();
            } catch (error: unknown) {
              setIsResetting(false);
              Alert.alert(
                'Reset failed',
                error instanceof Error ? error.message : 'The local identity could not be reset.'
              );
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            onRefresh={refreshAll}
            refreshing={isRefreshing}
            tintColor={colors.accent}
          />
        }
      >
        <Text style={styles.eyebrow}>LOOKING FOR TRADE</Text>
        <Text style={styles.title}>Hello, @{handle}</Text>
        <Text style={styles.subtitle}>
          Import your binder, compare want lists, and keep a record of every trade.
        </Text>

        {errors.length > 0 ? (
          <InlineNotice
            actionLabel="Retry all"
            message={errors.join(' ')}
            onAction={refreshAll}
            title="Some data may be out of date"
          />
        ) : null}

        <View style={styles.statsRow}>
          <StatTile
            accessibilityHint="Opens the Haves list in Binder"
            label="Cards to trade"
            onPress={() => openBinder('haves')}
            value={haveQuantity}
          />
          <StatTile
            accessibilityHint="Opens the Wants list in Binder"
            label="Cards wanted"
            onPress={() => openBinder('wants')}
            value={wantQuantity}
          />
        </View>
        <Text style={styles.uniqueCount}>
          {haves.length} unique haves · {wants.length} unique wants
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/map')}
          style={styles.homeStoreCard}
        >
          <Ionicons
            color={homeStore ? colors.accent : colors.textMuted}
            name={homeStore ? 'star' : 'star-outline'}
            size={24}
          />
          <View style={styles.actionText}>
            <Text style={styles.homeStoreLabel}>HOME STORE</Text>
            <Text style={styles.homeStoreName}>
              {homeStore?.name ?? 'Choose a home card shop'}
            </Text>
          </View>
          <Ionicons color={colors.textMuted} name="chevron-forward" size={20} />
        </Pressable>

        <Text style={styles.sectionTitle}>Quick actions</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => openImport('haves')}
          style={styles.actionCard}
        >
          <View style={styles.actionIcon}>
            <Ionicons color={colors.accent} name="albums-outline" size={24} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Import trade binder</Text>
            <Text style={styles.actionDescription}>Paste your cards available for trade.</Text>
          </View>
          <Ionicons color={colors.textMuted} name="chevron-forward" size={20} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => openImport('wants')}
          style={styles.actionCard}
        >
          <View style={styles.actionIcon}>
            <Ionicons color={colors.accent} name="heart-outline" size={24} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Import want list</Text>
            <Text style={styles.actionDescription}>Add the cards you are looking for.</Text>
          </View>
          <Ionicons color={colors.textMuted} name="chevron-forward" size={20} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/trade')}
          style={styles.actionCard}
        >
          <View style={styles.actionIcon}>
            <Ionicons color={colors.accent} name="swap-horizontal" size={24} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Find a trade</Text>
            <Text style={styles.actionDescription}>Show or scan a trader QR code.</Text>
          </View>
          <Ionicons color={colors.textMuted} name="chevron-forward" size={20} />
        </Pressable>

        {__DEV__ ? (
          <>
            <Text style={styles.sectionTitle}>Recording tools</Text>
            <View style={styles.developmentCard}>
              <View style={styles.developmentText}>
                <Text style={styles.developmentTitle}>Reset recording state</Text>
                <Text style={styles.developmentDescription}>
                  Create a fresh local UUID and return to handle setup without deleting Firebase.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={isResetting}
                onPress={confirmRecordingReset}
                style={({ pressed }) => [
                  styles.resetButton,
                  (pressed || isResetting) && styles.resetButtonPressed,
                ]}
              >
                {isResetting ? (
                  <ActivityIndicator color={colors.danger} size="small" />
                ) : (
                  <Ionicons color={colors.danger} name="refresh" size={19} />
                )}
                <Text style={styles.resetButtonText}>Reset</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  actionDescription: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  actionIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    color: colors.text,
    fontSize: typeScale.body,
    fontWeight: '700',
  },
  container: {
    flexGrow: 1,
    gap: spacing.lg,
    padding: spacing.xl,
    paddingBottom: 48,
  },
  developmentCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.danger,
    borderRadius: radii.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  developmentDescription: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  developmentText: {
    flex: 1,
  },
  developmentTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  eyebrow: {
    color: colors.accent,
    fontSize: typeScale.caption,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: spacing.sm,
  },
  homeStoreCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  homeStoreLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  homeStoreName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  resetButton: {
    alignItems: 'center',
    borderColor: colors.danger,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  resetButtonPressed: {
    opacity: 0.5,
  },
  resetButtonText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800',
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typeScale.body,
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typeScale.subtitle,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typeScale.display,
    fontWeight: '800',
  },
  uniqueCount: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: -spacing.sm,
    textAlign: 'center',
  },
});
