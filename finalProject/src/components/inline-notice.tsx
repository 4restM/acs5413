import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

type InlineNoticeProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function InlineNotice({ title, message, actionLabel, onAction }: InlineNoticeProps) {
  return (
    <View accessibilityRole="alert" style={styles.container}>
      <Ionicons color={colors.danger} name="cloud-offline-outline" size={22} />
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
    borderColor: colors.danger,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  actionText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '800',
  },
  container: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.danger,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  message: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.xs,
  },
  pressed: {
    opacity: 0.6,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
});
