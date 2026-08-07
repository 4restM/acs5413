import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { StoreMapProps } from '@/components/store-map.types';
import { colors, radii, spacing } from '@/constants/theme';

export default function StoreMapFallback({
  stores,
  homeStoreId,
  selectedStoreId,
  onSelectStore,
}: StoreMapProps) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Interactive map available on iOS and Android</Text>
        <Text style={styles.noticeText}>
          The web build uses this accessible store list because react-native-maps is a native
          component.
        </Text>
      </View>
      {stores.map((store) => (
        <Pressable
          key={store.id}
          onPress={() => onSelectStore(store)}
          style={[styles.storeCard, selectedStoreId === store.id && styles.storeCardSelected]}
        >
          <Text style={styles.storeName}>
            {store.name} {homeStoreId === store.id ? '★' : ''}
          </Text>
          <Text style={styles.address}>{store.address}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  address: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  container: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: 220,
  },
  notice: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    gap: spacing.xs,
    padding: spacing.md,
  },
  noticeText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  noticeTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  storeCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  storeCardSelected: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  storeName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
});
