import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typeScale } from '@/constants/theme';

type EmptyStateProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  message: string;
};

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons color={colors.accent} name={icon} size={34} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 56,
  },
  message: {
    color: colors.textMuted,
    fontSize: typeScale.body,
    lineHeight: 23,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  title: {
    color: colors.text,
    fontSize: typeScale.subtitle,
    fontWeight: '700',
  },
});
