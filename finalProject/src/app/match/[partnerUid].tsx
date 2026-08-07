import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CardRow } from '@/components/card-row';
import { EmptyState } from '@/components/empty-state';
import { colors, radii, spacing, typeScale } from '@/constants/theme';
import { useBinder } from '@/context/binder-context';
import { getTradePartner } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { computeBidirectionalMatch } from '@/lib/match';
import { sendLocalNotification } from '@/lib/notifications';
import type { BidirectionalMatch, MatchItem, TradePartner } from '@/types/trade';

function MatchSection({ title, subtitle, items }: { title: string; subtitle: string; items: MatchItem[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      {items.length === 0 ? (
        <Text style={styles.noMatches}>No matches in this direction.</Text>
      ) : (
        <View style={styles.cardList}>
          {items.map((item) => (
            <View key={item.card.cardKey}>
              <CardRow card={{ ...item.card, qty: item.matchQty }} />
              <Text style={styles.quantityNote}>
                {item.availableQty} available · {item.requestedQty} requested
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function MatchScreen() {
  const params = useLocalSearchParams<{ partnerUid: string }>();
  const { haves, wants } = useBinder();
  const [partner, setPartner] = useState<TradePartner | null>(null);
  const [match, setMatch] = useState<BidirectionalMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const notificationSent = useRef(false);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setErrorMessage(null);

    getTradePartner(params.partnerUid)
      .then((loadedPartner) => {
        if (isCancelled) return;
        const computedMatch = computeBidirectionalMatch(
          haves,
          wants,
          loadedPartner.haves,
          loadedPartner.wants
        );
        setPartner(loadedPartner);
        setMatch(computedMatch);

        const totalMatches =
          computedMatch.theyHaveForMe.length + computedMatch.iHaveForThem.length;
        // DISCUSSION POINT: Effects may rerun as binder state changes. The ref prevents
        // duplicate local notifications while this match screen remains mounted.
        if (totalMatches > 0 && !notificationSent.current) {
          notificationSent.current = true;
          const firstMatch = computedMatch.theyHaveForMe[0] ?? computedMatch.iHaveForThem[0];
          void sendLocalNotification({
            title: `${totalMatches} match${totalMatches === 1 ? '' : 'es'} with @${loadedPartner.handle}`,
            body: `A possible trade includes ${firstMatch.card.name}.`,
            data: { partnerUid: loadedPartner.uid, screen: 'match' },
          });
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setErrorMessage(getErrorMessage(error, 'The partner binder could not be loaded.'));
        }
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [haves, params.partnerUid, reloadKey, wants]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>Comparing both binders…</Text>
      </View>
    );
  }

  if (errorMessage || !partner || !match) {
    return (
      <View style={styles.centered}>
        <Ionicons color={colors.danger} name="cloud-offline-outline" size={40} />
        <Text style={styles.errorText}>{errorMessage ?? 'No partner data was returned.'}</Text>
        <Button
          color={colors.accent}
          onPress={() => {
            notificationSent.current = false;
            setReloadKey((value) => value + 1);
          }}
          title="Try again"
        />
      </View>
    );
  }

  const totalMatches = match.theyHaveForMe.length + match.iHaveForThem.length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.handle}>@{partner.handle}</Text>
        <Text style={styles.matchCount}>{totalMatches}</Text>
        <Text style={styles.matchLabel}>possible card matches</Text>
      </View>

      {totalMatches === 0 ? (
        <EmptyState
          icon="shuffle-outline"
          message="Your current haves and wants do not overlap with this trader yet."
          title="No matches this time"
        />
      ) : (
        <>
          <MatchSection
            items={match.theyHaveForMe}
            subtitle={`Cards @${partner.handle} has that appear in your wants.`}
            title="They have for you"
          />
          <MatchSection
            items={match.iHaveForThem}
            subtitle={`Cards you have that appear in @${partner.handle}’s wants.`}
            title="You have for them"
          />
          <View style={styles.nextStepCard}>
            <Text style={styles.nextStepTitle}>Ready to trade?</Text>
            <Text style={styles.nextStepText}>
              Select the cards exchanged, add notes, and optionally adjust your binder.
            </Text>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/log-trade',
                  params: { partnerUid: partner.uid },
                })
              }
              style={styles.logButton}
            >
              <Text style={styles.logButtonText}>Log this trade</Text>
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cardList: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  centered: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  container: {
    backgroundColor: colors.background,
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: 48,
  },
  errorText: {
    color: colors.danger,
    fontSize: typeScale.body,
    lineHeight: 23,
    textAlign: 'center',
  },
  handle: {
    color: colors.text,
    fontSize: typeScale.subtitle,
    fontWeight: '800',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: typeScale.body,
  },
  logButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    justifyContent: 'center',
    marginTop: spacing.lg,
    minHeight: 48,
  },
  logButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
  },
  matchCount: {
    color: colors.accentSoft,
    fontSize: 48,
    fontWeight: '900',
    marginTop: spacing.sm,
  },
  matchLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  nextStepCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  nextStepText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  nextStepTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  noMatches: {
    color: colors.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: spacing.md,
  },
  quantityNote: {
    color: colors.textMuted,
    fontSize: typeScale.caption,
    marginLeft: 70,
    marginTop: spacing.xs,
  },
  section: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typeScale.subtitle,
    fontWeight: '800',
  },
  summaryCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.xl,
  },
});
