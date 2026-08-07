import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import StoreMap from '@/components/store-map';
import { colors, radii, spacing } from '@/constants/theme';
import { useIdentity } from '@/context/identity-context';
import { useStores } from '@/context/store-context';
import { getErrorMessage } from '@/lib/errors';

type LocationState = 'idle' | 'checking' | 'granted' | 'denied' | 'unavailable';

export default function MapScreen() {
  const { homeStoreId, setHomeStore } = useIdentity();
  const {
    stores,
    isLoading,
    errorMessage,
    refresh,
    selectTradeStore,
  } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [locationState, setLocationState] = useState<LocationState>(
    Platform.OS === 'web' ? 'unavailable' : 'idle'
  );
  const [userCoordinate, setUserCoordinate] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isSavingHome, setIsSavingHome] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedStore = useMemo(
    () => stores.find((store) => store.id === selectedStoreId) ?? null,
    [selectedStoreId, stores]
  );

  const requestLocation = useCallback(async () => {
    if (Platform.OS === 'web') return;
    setLocationState('checking');
    try {
      // DISCUSSION POINT: Only foreground permission is requested. The app shows the user
      // dot while this screen is open and never tracks location in the background.
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationState('denied');
        return;
      }

      setLocationState('granted');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserCoordinate({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error: unknown) {
      console.warn('Location lookup failed:', error);
      setLocationState('unavailable');
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') void requestLocation();
  }, [requestLocation]);

  async function makeHomeStore() {
    if (!selectedStore) return;
    setIsSavingHome(true);
    setActionError(null);
    try {
      await setHomeStore(selectedStore.id);
    } catch (error: unknown) {
      setActionError(getErrorMessage(error, 'Your home store could not be saved.'));
    } finally {
      setIsSavingHome(false);
    }
  }

  function startTradeHere() {
    if (!selectedStore) return;
    selectTradeStore(selectedStore);
    router.push('/trade');
  }

  const locationLabel =
    locationState === 'granted'
      ? 'Location on'
      : locationState === 'checking'
        ? 'Locating…'
        : locationState === 'unavailable'
          ? 'Location unavailable'
          : 'Show my location';

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        <StoreMap
          homeStoreId={homeStoreId}
          onSelectStore={(store) => {
            setSelectedStoreId(store.id);
            setActionError(null);
          }}
          selectedStoreId={selectedStoreId}
          showsUserLocation={locationState === 'granted'}
          stores={stores}
          userCoordinate={userCoordinate}
        />

        <View pointerEvents="box-none" style={styles.topOverlay}>
          <View style={styles.storeCountCard}>
            <Text style={styles.storeCount}>{stores.length}</Text>
            <Text style={styles.storeCountLabel}>trade shops</Text>
          </View>
          <View style={styles.topActions}>
            {Platform.OS !== 'web' ? (
              <Pressable
                disabled={locationState === 'checking'}
                onPress={requestLocation}
                style={({ pressed }) => [styles.actionPill, pressed && styles.pressed]}
              >
                {locationState === 'checking' ? (
                  <ActivityIndicator color={colors.accent} size="small" />
                ) : (
                  <Ionicons
                    color={locationState === 'granted' ? colors.success : colors.accent}
                    name={locationState === 'granted' ? 'locate' : 'locate-outline'}
                    size={18}
                  />
                )}
                <Text style={styles.actionLabel}>{locationLabel}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => router.push('/add-store')}
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            >
              <Ionicons color={colors.background} name="add" size={22} />
              <Text style={styles.addButtonText}>Add store</Text>
            </Pressable>
          </View>
        </View>

        {isLoading && stores.length === 0 ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.loadingText}>Loading Firebase stores…</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorCard}>
            <Text numberOfLines={3} style={styles.errorText}>{errorMessage}</Text>
            <Pressable onPress={refresh}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {selectedStore ? (
          <View style={styles.selectionCard}>
            <View style={styles.selectionHeader}>
              <View style={styles.selectionText}>
                <Text numberOfLines={1} style={styles.selectionName}>{selectedStore.name}</Text>
                <Text numberOfLines={2} style={styles.selectionAddress}>
                  {selectedStore.address}
                </Text>
              </View>
              <Pressable onPress={() => setSelectedStoreId(null)} style={styles.closeButton}>
                <Ionicons color={colors.textMuted} name="close" size={21} />
              </Pressable>
            </View>

            {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}

            <View style={styles.selectionActions}>
              <Pressable
                disabled={isSavingHome || homeStoreId === selectedStore.id}
                onPress={makeHomeStore}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  (pressed || isSavingHome || homeStoreId === selectedStore.id) && styles.pressed,
                ]}
              >
                {isSavingHome ? (
                  <ActivityIndicator color={colors.accent} size="small" />
                ) : (
                  <Ionicons
                    color={colors.accent}
                    name={homeStoreId === selectedStore.id ? 'star' : 'star-outline'}
                    size={18}
                  />
                )}
                <Text style={styles.secondaryButtonText}>
                  {homeStoreId === selectedStore.id ? 'Home store' : 'Set as home'}
                </Text>
              </Pressable>
              <Pressable
                onPress={startTradeHere}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              >
                <Ionicons color={colors.background} name="swap-horizontal" size={18} />
                <Text style={styles.primaryButtonText}>Log a trade here</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionError: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
  },
  actionLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  actionPill: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 999,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  addButtonText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  container: {
    flex: 1,
  },
  errorCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.danger,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    left: spacing.lg,
    padding: spacing.md,
    position: 'absolute',
    right: spacing.lg,
    top: 74,
  },
  errorText: {
    color: colors.danger,
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  loadingCard: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    position: 'absolute',
    top: '45%',
  },
  loadingText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.65,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    flex: 1.25,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '600',
  },
  retryText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.accent,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  selectionAddress: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.xs,
  },
  selectionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    bottom: spacing.lg,
    gap: spacing.md,
    left: spacing.lg,
    padding: spacing.lg,
    position: 'absolute',
    right: spacing.lg,
  },
  selectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  selectionName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  selectionText: {
    flex: 1,
  },
  storeCount: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  storeCountCard: {
    alignItems: 'baseline',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 42,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  storeCountLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  topActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  topOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: spacing.md,
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
  },
});
