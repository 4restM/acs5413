import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontWeights, radii, spacing, tabularNumbers, typeScale } from '@/constants/theme';

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
    borderRadius: radii.md,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  containerPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  value: {
    ...tabularNumbers,
    color: colors.text,
    fontSize: typeScale.title,
    fontWeight: fontWeights.semibold,
  },
});
