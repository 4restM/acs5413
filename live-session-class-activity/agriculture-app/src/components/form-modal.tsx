import type { PropsWithChildren } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

type FormModalProps = PropsWithChildren<{
  visible: boolean;
  title: string;
  submitLabel: string;
  submitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: () => void;
}>;

export function FormModal({
  children,
  visible,
  title,
  submitLabel,
  submitting = false,
  error,
  onClose,
  onSubmit,
}: FormModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">{title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close form" onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {children}
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={submitLabel}
              accessibilityState={{ disabled: submitting }}
              disabled={submitting}
              onPress={onSubmit}
              style={[styles.submitButton, submitting && styles.disabledButton]}>
              {submitting ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.submitText}>{submitLabel}</Text>}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(16, 28, 17, 0.42)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '88%', backgroundColor: colors.surface, borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 20, fontWeight: '700', flex: 1 },
  closeButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.sm },
  closeText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  error: { color: colors.danger, backgroundColor: colors.dangerSoft, borderRadius: radii.sm, padding: spacing.md, lineHeight: 20 },
  submitButton: { minHeight: 48, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  disabledButton: { opacity: 0.65 },
  submitText: { color: colors.surface, fontSize: 16, fontWeight: '700' },
});
