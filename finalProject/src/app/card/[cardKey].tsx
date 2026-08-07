import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radii, spacing, typeScale } from '@/constants/theme';
import { useBinder } from '@/context/binder-context';
import { getCachedCards } from '@/lib/card-cache';
import { getErrorMessage } from '@/lib/errors';
import type { BinderListKind, CardMetadata } from '@/types/card';

export default function CardDetailScreen() {
  const params = useLocalSearchParams<{ cardKey: string; listKind?: string }>();
  const listKind: BinderListKind = params.listKind === 'wants' ? 'wants' : 'haves';
  const { haves, wants, setQuantity, removeCard } = useBinder();
  const cards = listKind === 'haves' ? haves : wants;
  const card = cards.find((item) => item.cardKey === params.cardKey);
  const [metadata, setMetadata] = useState<CardMetadata | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!params.cardKey) return;
    getCachedCards([params.cardKey])
      .then((cached) => setMetadata(cached[params.cardKey] ?? null))
      .catch((error: unknown) => console.warn('Card detail cache read failed:', error));
  }, [params.cardKey]);

  async function changeQuantity(nextQuantity: number) {
    if (!card || nextQuantity < 1) return;
    setIsWorking(true);
    setErrorMessage(null);
    try {
      await setQuantity(listKind, card.cardKey, nextQuantity);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, 'The card could not be updated.'));
    } finally {
      setIsWorking(false);
    }
  }

  function confirmRemove() {
    if (!card) return;
    Alert.alert('Remove card?', `Remove ${card.name} from your ${listKind}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setIsWorking(true);
          try {
            await removeCard(listKind, card.cardKey);
            router.back();
          } catch (error: unknown) {
            setErrorMessage(getErrorMessage(error, 'The card could not be removed.'));
            setIsWorking(false);
          }
        },
      },
    ]);
  }

  if (!card) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>This card is no longer in the selected list.</Text>
      </View>
    );
  }

  const imageUri = metadata?.imageNormal ?? card.imageSmall;

  return (
    <>
      <Stack.Screen options={{ title: card.name }} />
      <ScrollView contentContainerStyle={styles.container}>
        {imageUri ? (
          <Image resizeMode="contain" source={{ uri: imageUri }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.imagePlaceholder]}>
            <Ionicons color={colors.textMuted} name="image-outline" size={48} />
          </View>
        )}

        <Text style={styles.name}>{card.name}</Text>
        <Text style={styles.metadata}>
          {card.setCode}
          {metadata?.collectorNumber ? ` #${metadata.collectorNumber}` : ''}
        </Text>
        {metadata?.typeLine ? <Text style={styles.typeLine}>{metadata.typeLine}</Text> : null}
        {metadata?.manaCost ? <Text style={styles.manaCost}>{metadata.manaCost}</Text> : null}
        {metadata?.priceUsd ? <Text style={styles.price}>Scryfall price: ${metadata.priceUsd}</Text> : null}

        <View style={styles.quantityCard}>
          <View>
            <Text style={styles.quantityLabel}>Quantity in {listKind}</Text>
            <Text style={styles.quantityHelp}>Updates are saved to Firebase immediately.</Text>
          </View>
          <View style={styles.stepper}>
            <Pressable
              accessibilityLabel={`Decrease ${card.name} quantity`}
              accessibilityRole="button"
              disabled={isWorking || card.qty <= 1}
              onPress={() => changeQuantity(card.qty - 1)}
              style={styles.stepButton}
            >
              <Ionicons color={colors.text} name="remove" size={22} />
            </Pressable>
            {isWorking ? (
              <ActivityIndicator color={colors.accent} style={styles.quantityValue} />
            ) : (
              <Text style={styles.quantityValue}>{card.qty}</Text>
            )}
            <Pressable
              accessibilityLabel={`Increase ${card.name} quantity`}
              accessibilityRole="button"
              disabled={isWorking}
              onPress={() => changeQuantity(card.qty + 1)}
              style={styles.stepButton}
            >
              <Ionicons color={colors.text} name="add" size={22} />
            </Pressable>
          </View>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={isWorking}
          onPress={confirmRemove}
          style={styles.removeButton}
        >
          <Ionicons color={colors.danger} name="trash-outline" size={20} />
          <Text style={styles.removeText}>Remove from {listKind}</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  cardImage: {
    alignSelf: 'center',
    aspectRatio: 0.716,
    borderRadius: radii.lg,
    height: 380,
    marginBottom: spacing.xl,
    maxWidth: '100%',
  },
  centered: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  container: {
    backgroundColor: colors.background,
    padding: spacing.xl,
    paddingBottom: 48,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  imagePlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  manaCost: {
    color: colors.textMuted,
    fontSize: typeScale.body,
    marginTop: spacing.sm,
  },
  metadata: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: typeScale.title,
    fontWeight: '600',
  },
  price: {
    color: colors.success,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  quantityCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  quantityHelp: {
    color: colors.textMuted,
    fontSize: typeScale.caption,
    marginTop: spacing.xs,
    maxWidth: 180,
  },
  quantityLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  quantityValue: {
    color: colors.text,
    fontSize: typeScale.subtitle,
    fontWeight: '600',
    minWidth: 34,
    textAlign: 'center',
  },
  removeButton: {
    alignItems: 'center',
    borderColor: colors.danger,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.xl,
    minHeight: 48,
  },
  removeText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  stepButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.sm,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeLine: {
    color: colors.text,
    fontSize: typeScale.body,
    lineHeight: 23,
    marginTop: spacing.lg,
  },
});
