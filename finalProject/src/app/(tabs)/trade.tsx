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
import { isValidPartnerUid } from '@/lib/match';

type TradeMode = 'show' | 'scan';

export default function TradeScreen() {
  const { uid, handle } = useIdentity();
  const [mode, setMode] = useState<TradeMode>('show');
  const [permission, requestPermission] = useCameraPermissions();
  const [manualUid, setManualUid] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scannedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      scannedRef.current = false;
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

        {mode === 'show' ? (
          <View style={styles.qrSection}>
            <Text style={styles.title}>Let another player scan</Text>
            <Text style={styles.description}>
              This code contains only your device ID. Your binder stays in Firebase.
            </Text>
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

            <Text style={styles.fallbackTitle}>Simulator or camera fallback</Text>
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
                <Text style={styles.findButtonText}>Match</Text>
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
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
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
    fontWeight: '700',
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
    fontWeight: '800',
  },
  handle: {
    color: colors.text,
    fontSize: typeScale.subtitle,
    fontWeight: '800',
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
    fontWeight: '800',
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  qrSection: {
    alignItems: 'center',
    flex: 1,
    paddingTop: spacing.xl,
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
    fontWeight: '700',
  },
  segmentTextActive: {
    color: colors.background,
  },
  title: {
    color: colors.text,
    fontSize: typeScale.title,
    fontWeight: '800',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  uuid: {
    color: colors.textMuted,
    fontSize: typeScale.caption,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
