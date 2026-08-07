import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ActivityIndicator,
  Button,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { colors, radii, spacing, typeScale } from '@/constants/theme';
import { useStores } from '@/context/store-context';
import { useTrades } from '@/context/trade-context';
import { formatTradeDate } from '@/lib/trade';
import type { TradeLine, TradeRecord } from '@/types/trade';

function formatLines(lines: TradeLine[]) {
  if (lines.length === 0) return 'None';
  return lines.map((card) => `${card.qty}× ${card.name}`).join(', ');
}

function TradeHistoryCard({ trade, storeName }: { trade: TradeRecord; storeName?: string }) {
  const givenQty = trade.given.reduce((total, card) => total + card.qty, 0);
  const receivedQty = trade.received.reduce((total, card) => total + card.qty, 0);

  return (
    <View style={styles.tradeCard}>
      <View style={styles.tradeHeader}>
        <View>
          <Text style={styles.partner}>@{trade.partnerHandle}</Text>
          <Text style={styles.date}>{formatTradeDate(trade.createdAt)}</Text>
        </View>
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryText}>{givenQty} out / {receivedQty} in</Text>
        </View>
      </View>

      <View style={styles.directionRow}>
        <Ionicons color={colors.danger} name="arrow-up-circle-outline" size={20} />
        <View style={styles.directionText}>
          <Text style={styles.directionLabel}>Gave</Text>
          <Text style={styles.cardNames}>{formatLines(trade.given)}</Text>
        </View>
      </View>
      <View style={styles.directionRow}>
        <Ionicons color={colors.success} name="arrow-down-circle-outline" size={20} />
        <View style={styles.directionText}>
          <Text style={styles.directionLabel}>Received</Text>
          <Text style={styles.cardNames}>{formatLines(trade.received)}</Text>
        </View>
      </View>

      {storeName ? (
        <View style={styles.locationRow}>
          <Ionicons color={colors.accent} name="location-outline" size={17} />
          <Text style={styles.locationText}>{storeName}</Text>
        </View>
      ) : null}

      {trade.notes ? <Text style={styles.notes}>{trade.notes}</Text> : null}
    </View>
  );
}

export default function HistoryScreen() {
  const { trades, isLoading, errorMessage, refresh } = useTrades();
  const { stores } = useStores();

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      {isLoading && trades.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : errorMessage && trades.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Button color={colors.accent} onPress={refresh} title="Try again" />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={[
            styles.listContent,
            trades.length === 0 && styles.emptyListContent,
          ]}
          data={trades}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyState
              icon="time-outline"
              message="Completed trades will be saved here for quick reference."
              title="No trades logged"
            />
          }
          refreshControl={
            <RefreshControl
              onRefresh={refresh}
              refreshing={isLoading}
              tintColor={colors.accent}
            />
          }
          renderItem={({ item }) => (
            <TradeHistoryCard
              storeName={stores.find((store) => store.id === item.storeId)?.name}
              trade={item}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cardNames: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  date: {
    color: colors.textMuted,
    fontSize: typeScale.caption,
    marginTop: spacing.xs,
  },
  directionLabel: {
    color: colors.textMuted,
    fontSize: typeScale.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  directionRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  directionText: {
    flex: 1,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: typeScale.body,
    lineHeight: 23,
    textAlign: 'center',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 48,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  locationText: {
    color: colors.accentSoft,
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  notes: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.sm,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  partner: {
    color: colors.text,
    fontSize: typeScale.subtitle,
    fontWeight: '800',
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  separator: {
    height: spacing.md,
  },
  summaryBadge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  summaryText: {
    color: colors.accentSoft,
    fontSize: typeScale.caption,
    fontWeight: '800',
  },
  tradeCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  tradeHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
