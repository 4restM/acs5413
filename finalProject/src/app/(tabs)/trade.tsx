import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii, spacing, typeScale } from '@/constants/theme';
import { useIdentity } from '@/context/identity-context';
import { useStores } from '@/context/store-context';
import { isValidPartnerUid } from '@/lib/match';

type TradeMode = 'show' | 'scan';

export default function TradeScreen() {
  const { uid, handle } = useIdentity();
  const { selectedTradeStore, selectTradeStore } = useStores();
  const [mode, setMode] = useState<TradeMode>('show');
  const [permission, requestPermission] = useCameraPermissions();
  const [manualUid, setManualUid] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // The camera repeats callbacks while a QR is visible; this blocks duplicate routes.
  const scannedRef = useRef(false);

  // Leave the camera off when coming back so it cannot rescan the same code.
  useFocusEffect(
    useCallback(() => {
      setMode('show');
      setErrorMessage(null);
    }, [])
  );

  function openMatch(rawUid: string) {
    const partnerUid = rawUid.trim();
    if (!isValidPartnerUid(partnerUid)) {
      setErrorMessage('Enter or scan a valid partner UUID.');
      return false;
    }
    if (partnerUid.toLowerCase() === uid?.toLowerCase()) {
      setErrorMessage('That is your own trade code. Scan another player’s code.');
      return false;
    }

    setErrorMessage(null);
    router.push({ pathname: '/match/[partnerUid]', params: { partnerUid } });
    return true;
  }

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (scannedRef.current) return;
    scannedRef.current = true;
    if (!openMatch(result.data)) scannedRef.current = false;
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.segmentedControl}>
          {(['show', 'scan'] as const).map((item) => (
            <Pressable
              key={item}
              onPress={() => {
                if (item === 'scan') scannedRef.current = false;
                setMode(item);
                setErrorMessage(null);
              }}
              style={[styles.segment, mode === item && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, mode === item && styles.segmentTextActive]}>
                {item === 'show' ? 'My QR' : 'Scan'}
              </Text>
            </Pressable>
          ))}
        </View>

        {selectedTradeStore ? (
          <View style={styles.storeBanner}>
            <Ionicons color={colors.accent} name="location" size={20} />
            <View style={styles.storeBannerText}>
              <Text style={styles.storeBannerLabel}>TRADING AT</Text>
              <Text numberOfLines={1} style={styles.storeBannerName}>
                {selectedTradeStore.name}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Clear trade location"
              onPress={() => selectTradeStore(null)}
              style={styles.clearStoreButton}
            >
              <Ionicons color={colors.textMuted} name="close" size={20} />
            </Pressable>
          </View>
        ) : null}

        {mode === 'show' ? (
          <View style={styles.qrSection}>
            <View style={styles.qrCard}>
              {uid ? <QRCode backgroundColor="#FFFFFF" size={240} value={uid} /> : null}
            </View>
            <Text style={styles.handle}>@{handle}</Text>
            <Text selectable style={styles.uuid}>
              {uid}
            </Text>
          </View>
        ) : (
          <View style={styles.scanSection}>
            {!permission ? (
              <ActivityIndicator color={colors.accent} size="large" />
            ) : !permission.granted ? (
              <View style={styles.permissionCard}>
                <Ionicons color={colors.accent} name="camera-outline" size={36} />
                <Text style={styles.permissionTitle}>Camera permission needed</Text>
                <Text style={styles.permissionText}>
                  Allow camera access to scan another trader’s QR code.
                </Text>
                <Button color={colors.accent} onPress={requestPermission} title="Allow camera" />
              </View>
            ) : (
              <View style={styles.cameraFrame}>
                <CameraView
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  facing="back"
                  onBarcodeScanned={handleBarcodeScanned}
                  style={styles.camera}
                />
                <View pointerEvents="none" style={styles.scanGuide} />
              </View>
            )}

            <Text style={styles.fallbackTitle}>Camera fallback</Text>
            <View style={styles.manualRow}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setManualUid}
                onSubmitEditing={() => openMatch(manualUid)}
                placeholder="Paste partner UUID"
                placeholderTextColor={colors.textMuted}
                returnKeyType="go"
                style={styles.manualInput}
                value={manualUid}
              />
              <Pressable onPress={() => openMatch(manualUid)} style={styles.findButton}>
                <Text style={styles.findButtonText}>Find</Text>
              </Pressable>
            </View>
          </View>
        )}

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
  cameraFrame: {
    aspectRatio: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
  },
  clearStoreButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  fallbackTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    marginTop: spacing.lg,
  },
  findButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  findButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  handle: {
    color: colors.text,
    fontSize: typeScale.subtitle,
    fontWeight: '600',
    marginTop: spacing.lg,
  },
  manualInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 14,
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  manualRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  permissionCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
  },
  permissionText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  permissionTitle: {
    color: colors.text,
    fontSize: typeScale.subtitle,
    fontWeight: '600',
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  qrSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scanGuide: {
    borderColor: colors.accent,
    borderRadius: radii.md,
    borderWidth: 3,
    bottom: '18%',
    left: '18%',
    position: 'absolute',
    right: '18%',
    top: '18%',
  },
  scanSection: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: spacing.lg,
  },
  storeBanner: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  storeBannerLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  storeBannerName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  storeBannerText: {
    flex: 1,
  },
  segment: {
    alignItems: 'center',
    borderRadius: radii.sm,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  segmentActive: {
    backgroundColor: colors.accent,
  },
  segmentedControl: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    flexDirection: 'row',
    padding: spacing.xs,
  },
  segmentText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: colors.background,
  },
  uuid: {
    color: colors.textMuted,
    fontSize: typeScale.caption,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
