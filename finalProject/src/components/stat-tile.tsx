import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typeScale } from '@/constants/theme';

type StatTileProps = {
  label: string;
  value: number;
};

export function StatTile({ label, value }: StatTileProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
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
