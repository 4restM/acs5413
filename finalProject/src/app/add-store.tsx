import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Button,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radii, spacing, typeScale } from '@/constants/theme';
import { useStores } from '@/context/store-context';
import { getErrorMessage } from '@/lib/errors';
import { parseStoreCoordinates } from '@/lib/stores';

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'decimal-pad';
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCorrect={false}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, multiline && styles.multilineInput]}
        textAlignVertical={multiline ? 'top' : 'center'}
        value={value}
      />
    </View>
  );
}

export default function AddStoreScreen() {
  const { addStore } = useStores();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function useCurrentLocation() {
    if (Platform.OS === 'web') return;
    setIsLocating(true);
    setErrorMessage(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error('Location permission was not granted.');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLatitude(location.coords.latitude.toFixed(6));
      setLongitude(location.coords.longitude.toFixed(6));
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, 'Your location could not be read.'));
    } finally {
      setIsLocating(false);
    }
  }

  async function submitStore() {
    const normalizedName = name.trim();
    const normalizedAddress = address.trim();
    if (normalizedName.length < 2) {
      setErrorMessage('Enter a store name with at least two characters.');
      return;
    }
    if (normalizedAddress.length < 5) {
      setErrorMessage('Enter a complete street address.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      const coordinates = parseStoreCoordinates(latitude, longitude);
      await addStore({
        name: normalizedName,
        address: normalizedAddress,
        ...coordinates,
      });
      router.back();
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, 'The store could not be saved.'));
      setIsSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={styles.eyebrow}>COMMUNITY MAP</Text>
          <Text style={styles.title}>Add a card shop</Text>
          <Text style={styles.description}>
            The store is shared through Firebase, so every app user receives the new marker.
          </Text>
        </View>

        <View style={styles.formCard}>
          <FormField
            label="Store name"
            onChangeText={setName}
            placeholder="Local game store"
            value={name}
          />
          <FormField
            label="Street address"
            multiline
            onChangeText={setAddress}
            placeholder="123 Main St, Edmond, OK 73034"
            value={address}
          />

          <View style={styles.coordinatesHeader}>
            <View style={styles.coordinatesText}>
              <Text style={styles.label}>Marker coordinates</Text>
              <Text style={styles.helpText}>Use the store location, not your home address.</Text>
            </View>
            {Platform.OS !== 'web' ? (
              <Button
                color={colors.accent}
                disabled={isLocating || isSaving}
                onPress={useCurrentLocation}
                title={isLocating ? 'Locating…' : 'Use current'}
              />
            ) : null}
          </View>

          <View style={styles.coordinateRow}>
            <View style={styles.coordinateField}>
              <FormField
                keyboardType="decimal-pad"
                label="Latitude"
                onChangeText={setLatitude}
                placeholder="35.653664"
                value={latitude}
              />
            </View>
            <View style={styles.coordinateField}>
              <FormField
                keyboardType="decimal-pad"
                label="Longitude"
                onChangeText={setLongitude}
                placeholder="-97.481560"
                value={longitude}
              />
            </View>
          </View>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <View style={styles.footer}>
          <Button color={colors.textMuted} onPress={() => router.back()} title="Cancel" />
          <Pressable
            disabled={isSaving}
            onPress={submitStore}
            style={({ pressed }) => [
              styles.saveButton,
              (pressed || isSaving) && styles.buttonPressed,
            ]}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <Ionicons color={colors.background} name="location" size={19} />
                <Text style={styles.saveButtonText}>Add map marker</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  buttonPressed: {
    opacity: 0.6,
  },
  container: {
    backgroundColor: colors.background,
    gap: spacing.xl,
    padding: spacing.lg,
    paddingBottom: 48,
  },
  coordinateField: {
    flex: 1,
  },
  coordinateRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  coordinatesHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coordinatesText: {
    flex: 1,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  field: {
    gap: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'flex-end',
  },
  formCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  helpText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  keyboardView: {
    backgroundColor: colors.background,
    flex: 1,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  multilineInput: {
    minHeight: 76,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: spacing.lg,
  },
  saveButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '900',
  },
  title: {
    color: colors.text,
    fontSize: typeScale.title,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
});
