import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

type ScreenStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
  tone?: 'default' | 'error';
};

export function ScreenState({ title, message, actionLabel, onAction, loading = false, tone = 'default' }: ScreenStateProps) {
  return (
    <View style={[styles.container, tone === 'error' && styles.errorContainer]} accessibilityRole={tone === 'error' ? 'alert' : undefined}>
      {loading ? <ActivityIndicator color={colors.primary} size="large" /> : null}
      <Text style={styles.title} accessibilityRole="header">{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" accessibilityLabel={actionLabel} onPress={onAction} style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, backgroundColor: colors.surface, marginTop: spacing.lg },
  errorContainer: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  title: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  message: { color: colors.mutedText, fontSize: 15, lineHeight: 21, textAlign: 'center' },
  action: { minHeight: 44, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: radii.md, marginTop: spacing.sm },
  actionText: { color: colors.surface, fontWeight: '700' },
});
