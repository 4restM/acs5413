import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontWeights, radii, spacing } from '@/constants/theme';

type InlineNoticeProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function InlineNotice({ title, message, actionLabel, onAction }: InlineNoticeProps) {
  return (
    <View accessibilityRole="alert" style={styles.container}>
      <Ionicons color={colors.danger} name="cloud-offline-outline" size={18} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  actionText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: fontWeights.medium,
  },
  container: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderLeftColor: colors.danger,
    borderLeftWidth: 2,
    borderRadius: radii.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  message: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.5,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 13,
    fontWeight: fontWeights.medium,
  },
});
