import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typeScale } from '@/constants/theme';
import type { BinderCard } from '@/types/card';

type CardRowProps = {
  card: BinderCard;
  onPress?: () => void;
};

export function CardRow({ card, onPress }: CardRowProps) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      {card.imageSmall ? (
        <Image source={{ uri: card.imageSmall }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons color={colors.textMuted} name="image-outline" size={24} />
        </View>
      )}
      <View style={styles.details}>
        <Text numberOfLines={2} style={styles.name}>
          {card.name}
        </Text>
        <Text style={styles.setCode}>{card.setCode}</Text>
      </View>
      <View style={styles.quantityBadge}>
        <Text style={styles.quantity}>×{card.qty}</Text>
      </View>
      {onPress ? <Ionicons color={colors.textMuted} name="chevron-forward" size={18} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 82,
    overflow: 'hidden',
    paddingRight: spacing.md,
  },
  details: {
    flex: 1,
  },
  image: {
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceAlt,
    width: 58,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: colors.text,
    fontSize: typeScale.body,
    fontWeight: '700',
  },
  pressed: {
    backgroundColor: colors.surfaceAlt,
    opacity: 0.85,
  },
  quantity: {
    color: colors.accentSoft,
    fontSize: 14,
    fontWeight: '800',
  },
  quantityBadge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  setCode: {
    color: colors.textMuted,
    fontSize: typeScale.caption,
    fontWeight: '700',
    marginTop: spacing.xs,
    textTransform: 'uppercase',
  },
});
