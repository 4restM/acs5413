import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radii, spacing, typeScale } from '@/constants/theme';

type StatTileProps = {
  accessibilityHint: string;
  label: string;
  onPress: () => void;
  value: number;
};

export function StatTile({ accessibilityHint, label, onPress, value }: StatTileProps) {
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={`${label}: ${value}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.containerPressed]}
    >
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flex: 1,
    padding: spacing.lg,
  },
  containerPressed: {
    borderColor: colors.accent,
    opacity: 0.8,
  },
  label: {
    color: colors.textMuted,
    fontSize: typeScale.caption,
    fontWeight: '700',
    marginTop: spacing.xs,
    textTransform: 'uppercase',
  },
  value: {
    color: colors.accentSoft,
    fontSize: typeScale.title,
    fontWeight: '800',
  },
});
