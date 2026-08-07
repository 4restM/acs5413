import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CardRow } from '@/components/card-row';
import { colors, radii, spacing, typeScale } from '@/constants/theme';
import { useBinder } from '@/context/binder-context';
import { useStores } from '@/context/store-context';
import { useTrades } from '@/context/trade-context';
import { getTradePartner } from '@/lib/api';
import { computeBidirectionalMatch } from '@/lib/match';
import { sendLocalNotification } from '@/lib/notifications';
import type {
  BidirectionalMatch,
  MatchItem,
  TradePartner,
  TradeSelection,
} from '@/types/trade';

type SelectionMap = Record<string, number>;

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : 'The trade could not be saved.';
}

function SelectionSection({
  title,
  items,
  selections,
  onChange,
}: {
  title: string;
  items: MatchItem[];
  selections: SelectionMap;
  onChange: (cardKey: string, qty: number) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.mutedText}>No matched cards are available in this direction.</Text>
      ) : (
        <View style={styles.selectionList}>
          {items.map((item) => {
            const selectedQty = selections[item.card.cardKey] ?? 0;
            return (
              <View key={item.card.cardKey} style={styles.selectionItem}>
                <CardRow card={{ ...item.card, qty: item.matchQty }} />
                <View style={styles.selectionFooter}>
                  <Text style={styles.mutedText}>Select up to {item.matchQty}</Text>
                  <View style={styles.stepper}>
                    <Pressable
                      disabled={selectedQty === 0}
                      onPress={() => onChange(item.card.cardKey, selectedQty - 1)}
                      style={[styles.stepButton, selectedQty === 0 && styles.disabled]}
                    >
                      <Ionicons color={colors.text} name="remove" size={20} />
                    </Pressable>
                    <Text style={styles.selectedQty}>{selectedQty}</Text>
                    <Pressable
                      disabled={selectedQty >= item.matchQty}
                      onPress={() => onChange(item.card.cardKey, selectedQty + 1)}
                      style={[
                        styles.stepButton,
                        selectedQty >= item.matchQty && styles.disabled,
                      ]}
                    >
                      <Ionicons color={colors.text} name="add" size={20} />
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function selectionsToCards(items: MatchItem[], selections: SelectionMap): TradeSelection[] {
  return items.flatMap((item) => {
    const qty = selections[item.card.cardKey] ?? 0;
    return qty > 0 ? [{ cardKey: item.card.cardKey, name: item.card.name, qty }] : [];
  });
}

export default function LogTradeScreen() {
  const params = useLocalSearchParams<{ partnerUid: string }>();
  const { haves, wants, applyTradeSelections } = useBinder();
  const { selectedTradeStore, selectTradeStore } = useStores();
  const { recordTrade } = useTrades();
  const [partner, setPartner] = useState<TradePartner | null>(null);
  const [match, setMatch] = useState<BidirectionalMatch | null>(null);
  const [givenSelections, setGivenSelections] = useState<SelectionMap>({});
  const [receivedSelections, setReceivedSelections] = useState<SelectionMap>({});
  const [notes, setNotes] = useState('');
  const [adjustBinder, setAdjustBinder] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    getTradePartner(params.partnerUid)
      .then((loadedPartner) => {
        if (isCancelled) return;
        setPartner(loadedPartner);
        setMatch(
          computeBidirectionalMatch(haves, wants, loadedPartner.haves, loadedPartner.wants)
        );
      })
      .catch((error: unknown) => {
        if (!isCancelled) setErrorMessage(messageFromError(error));
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [haves, params.partnerUid, wants]);

  const given = useMemo(
    () => selectionsToCards(match?.iHaveForThem ?? [], givenSelections),
    [givenSelections, match?.iHaveForThem]
  );
  const received = useMemo(
    () => selectionsToCards(match?.theyHaveForMe ?? [], receivedSelections),
    [match?.theyHaveForMe, receivedSelections]
  );
  const givenQty = given.reduce((total, card) => total + card.qty, 0);
  const receivedQty = received.reduce((total, card) => total + card.qty, 0);

  async function saveTrade() {
    if (!partner || (given.length === 0 && received.length === 0)) {
      setErrorMessage('Select at least one card to record this trade.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      await recordTrade({
        partnerUid: partner.uid,
        partnerHandle: partner.handle,
        given: given.map(({ name, qty }) => ({ name, qty })),
        received: received.map(({ name, qty }) => ({ name, qty })),
        storeId: selectedTradeStore?.id,
        notes: notes.trim(),
      });

      let adjustmentFailed = false;
      if (adjustBinder) {
        try {
          await applyTradeSelections(given, received);
        } catch (error: unknown) {
          adjustmentFailed = true;
          console.warn('Trade saved but binder adjustment failed:', error);
        }
      }

      await sendLocalNotification({
        title: `Trade with @${partner.handle} recorded`,
        body: `${givenQty} out, ${receivedQty} in.`,
        data: { partnerUid: partner.uid, screen: 'history' },
      });
      selectTradeStore(null);

      if (adjustmentFailed) {
        Alert.alert(
          'Trade recorded',
          'The history entry was saved, but the binder quantities could not be adjusted.',
          [{ text: 'View history', onPress: () => router.replace('/history') }]
        );
      } else {
        router.replace('/history');
      }
    } catch (error: unknown) {
      setErrorMessage(messageFromError(error));
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.mutedText}>Preparing trade details…</Text>
      </View>
    );
  }

  if (errorMessage && (!partner || !match)) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <Button color={colors.textMuted} onPress={() => router.back()} title="Close" />
      </View>
    );
  }

  if (!partner || !match) return null;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Trade with @{partner.handle}</Text>
      <Text style={styles.description}>Choose the exact quantities exchanged in person.</Text>

      <SelectionSection
        items={match.iHaveForThem}
        onChange={(cardKey, qty) =>
          setGivenSelections((current) => ({ ...current, [cardKey]: qty }))
        }
        selections={givenSelections}
        title="You give"
      />
      <SelectionSection
        items={match.theyHaveForMe}
        onChange={(cardKey, qty) =>
          setReceivedSelections((current) => ({ ...current, [cardKey]: qty }))
        }
        selections={receivedSelections}
        title="You receive"
      />

      {selectedTradeStore ? (
        <View style={styles.storeCard}>
          <Ionicons color={colors.accent} name="location" size={22} />
          <View style={styles.storeCardText}>
            <Text style={styles.storeLabel}>TRADE LOCATION</Text>
            <Text style={styles.storeName}>{selectedTradeStore.name}</Text>
            <Text style={styles.mutedText}>{selectedTradeStore.address}</Text>
          </View>
        </View>
      ) : null}

      <Text style={styles.label}>Notes</Text>
      <TextInput
        editable={!isSaving}
        maxLength={500}
        multiline
        onChangeText={setNotes}
        placeholder="Condition, cash added, or other details"
        placeholderTextColor={colors.textMuted}
        style={styles.notesInput}
        textAlignVertical="top"
        value={notes}
      />

      <View style={styles.adjustRow}>
        <View style={styles.adjustText}>
          <Text style={styles.adjustTitle}>Adjust my binder after saving</Text>
          <Text style={styles.mutedText}>Subtract given cards from haves and received cards from wants.</Text>
        </View>
        <Switch
          onValueChange={setAdjustBinder}
          thumbColor={adjustBinder ? colors.accentSoft : colors.textMuted}
          trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
          value={adjustBinder}
        />
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Pressable
        disabled={isSaving || (given.length === 0 && received.length === 0)}
        onPress={saveTrade}
        style={({ pressed }) => [
          styles.saveButton,
          (pressed || isSaving || (given.length === 0 && received.length === 0)) &&
            styles.disabled,
        ]}
      >
        {isSaving ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={styles.saveButtonText}>
            Save trade · {givenQty} out / {receivedQty} in
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  adjustRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  adjustText: {
    flex: 1,
  },
  adjustTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: spacing.xs,
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
  description: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: -spacing.md,
  },
  disabled: {
    opacity: 0.4,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: -spacing.md,
  },
  mutedText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: typeScale.body,
    minHeight: 100,
    padding: spacing.md,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  saveButtonText: {
    color: colors.background,
    fontSize: typeScale.body,
    fontWeight: '800',
  },
  section: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typeScale.subtitle,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  selectedQty: {
    color: colors.text,
    fontSize: typeScale.subtitle,
    fontWeight: '800',
    minWidth: 30,
    textAlign: 'center',
  },
  selectionFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 70,
    marginTop: spacing.sm,
  },
  selectionItem: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingBottom: spacing.md,
  },
  selectionList: {
    gap: spacing.md,
  },
  stepButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.sm,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  storeCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  storeCardText: {
    flex: 1,
  },
  storeLabel: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  storeName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: typeScale.title,
    fontWeight: '800',
  },
});
