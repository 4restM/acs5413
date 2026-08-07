import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii, spacing, typeScale } from '@/constants/theme';
import { useIdentity } from '@/context/identity-context';
import { getErrorMessage } from '@/lib/errors';

export default function OnboardingScreen() {
  const { uid, completeOnboarding } = useIdentity();
  const [handle, setHandle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const trimmedHandle = handle.trim();
  const canSubmit = trimmedHandle.length >= 2 && !isSaving;

  async function submitHandle() {
    if (!canSubmit) return;

    setIsSaving(true);
    setErrorMessage(null);
    try {
      await completeOnboarding(trimmedHandle);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, 'Your profile could not be saved.'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          <Text style={styles.eyebrow}>WELCOME, PLANESWALKER</Text>
          <Text style={styles.title}>Choose your trade handle</Text>
          <Text style={styles.description}>
            Other players will see this name when you compare binders and log a trade.
          </Text>

          <View style={styles.formCard}>
            <Text style={styles.label}>Handle</Text>
            <View style={styles.inputRow}>
              <Text style={styles.atSign}>@</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSaving}
                maxLength={24}
                onChangeText={setHandle}
                onSubmitEditing={submitHandle}
                placeholder="forestmage"
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
                style={styles.input}
                value={handle}
              />
            </View>
            <Text style={styles.help}>Use 2–24 characters.</Text>

            {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

            <Pressable
              disabled={!canSubmit}
              onPress={submitHandle}
              style={({ pressed }) => [
                styles.button,
                !canSubmit && styles.buttonDisabled,
                pressed && canSubmit && styles.buttonPressed,
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.buttonText}>Create profile</Text>
              )}
            </Pressable>
          </View>

          <Text selectable style={styles.deviceId}>
            Device ID: {uid ?? 'Preparing identity…'}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  atSign: {
    color: colors.textMuted,
    fontSize: typeScale.subtitle,
    fontWeight: '500',
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    justifyContent: 'center',
    marginTop: spacing.lg,
    minHeight: 50,
    paddingHorizontal: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonPressed: {
    backgroundColor: colors.accentSoft,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: colors.background,
    fontSize: typeScale.body,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  description: {
    color: colors.textMuted,
    fontSize: typeScale.body,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  deviceId: {
    color: colors.textMuted,
    fontSize: typeScale.caption,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: typeScale.caption,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  help: {
    color: colors.textMuted,
    fontSize: typeScale.caption,
    marginTop: spacing.sm,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: typeScale.subtitle,
    paddingVertical: spacing.md,
  },
  inputRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  keyboardView: {
    flex: 1,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: typeScale.title,
    fontWeight: '600',
    lineHeight: 34,
    marginBottom: spacing.md,
  },
});
