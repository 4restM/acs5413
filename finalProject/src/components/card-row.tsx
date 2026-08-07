import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontWeights, radii, spacing, tabularNumbers, typeScale } from '@/constants/theme';
import type { BinderCard } from '@/types/card';

type CardRowProps = {
  card: BinderCard;
  onPress?: () => void;
};

export function CardRow({ card, onPress }: CardRowProps) {
  return (
    <Pressable
      accessibilityLabel={`${card.name}, ${card.setCode}, quantity ${card.qty}`}
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      {card.imageSmall ? (
        <Image accessibilityElementsHidden source={{ uri: card.imageSmall }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons color={colors.textMuted} name="image-outline" size={18} />
        </View>
      )}
      <View style={styles.details}>
        <Text numberOfLines={1} style={styles.name}>
          {card.name}
        </Text>
        <Text style={styles.setCode}>{card.setCode}</Text>
      </View>
      <Text style={styles.quantity}>{card.qty}</Text>
      {onPress ? <Ionicons color={colors.textMuted} name="chevron-forward" size={16} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 64,
    paddingVertical: spacing.sm,
  },
  details: {
    flex: 1,
    gap: 2,
  },
  image: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.sm,
    height: 48,
    width: 34,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: fontWeights.medium,
  },
  pressed: {
    opacity: 0.55,
  },
  quantity: {
    ...tabularNumbers,
    color: colors.text,
    fontSize: 15,
    fontWeight: fontWeights.medium,
    minWidth: 28,
    textAlign: 'right',
  },
  setCode: {
    color: colors.textMuted,
    fontSize: typeScale.caption,
  },
});
