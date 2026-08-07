import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardRow } from '@/components/card-row';
import { EmptyState } from '@/components/empty-state';
import { InlineNotice } from '@/components/inline-notice';
import { colors, hairline, radii, spacing, typeScale } from '@/constants/theme';
import { useBinder } from '@/context/binder-context';
import type { BinderCard, BinderListKind } from '@/types/card';

export default function BinderScreen() {
  const params = useLocalSearchParams<{ listKind?: string }>();
  const { haves, wants, isLoading, errorMessage, refresh } = useBinder();
  const requestedListKind: BinderListKind | null =
    params.listKind === 'haves' || params.listKind === 'wants' ? params.listKind : null;
  const [listKind, setListKind] = useState<BinderListKind>(requestedListKind ?? 'haves');
  const [query, setQuery] = useState('');
  const cards = listKind === 'haves' ? haves : wants;

  useFocusEffect(
    useCallback(() => {
      if (requestedListKind) setListKind(requestedListKind);
    }, [requestedListKind])
  );

  const filteredCards = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return cards;
    return cards.filter((card) => card.name.toLowerCase().includes(normalizedQuery));
  }, [cards, query]);

  function openImport() {
    router.push({ pathname: '/import', params: { listKind } });
  }

  function openCard(card: BinderCard) {
    router.push({
      pathname: '/card/[cardKey]',
      params: { cardKey: card.cardKey, listKind },
    });
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.segmentedControl}>
          {(['haves', 'wants'] as const).map((kind) => (
            <Pressable
              key={kind}
              onPress={() => setListKind(kind)}
              style={[styles.segment, listKind === kind && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, listKind === kind && styles.segmentTextActive]}>
                {kind === 'haves' ? `Haves (${haves.length})` : `Wants (${wants.length})`}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.toolbar}>
          <View style={styles.searchContainer}>
            <Ionicons color={colors.textMuted} name="search" size={18} />
            <TextInput
              onChangeText={setQuery}
              placeholder="Search cards"
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              value={query}
            />
          </View>
          <Pressable onPress={openImport} style={styles.importButton}>
            <Ionicons color={colors.background} name="add" size={21} />
            <Text style={styles.importButtonText}>Import</Text>
          </Pressable>
        </View>

        {isLoading && cards.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : errorMessage && cards.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Button color={colors.accent} onPress={refresh} title="Try again" />
          </View>
        ) : (
          <FlatList
            contentContainerStyle={[
              styles.listContent,
              filteredCards.length === 0 && styles.emptyListContent,
            ]}
            data={filteredCards}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            keyExtractor={(item) => item.cardKey}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              errorMessage ? (
                <InlineNotice
                  actionLabel="Retry"
                  message={errorMessage}
                  onAction={refresh}
                  title="Showing saved binder data"
                />
              ) : null
            }
            ListHeaderComponentStyle={errorMessage ? styles.listHeader : undefined}
            ListEmptyComponent={
              <EmptyState
                icon={query ? 'search-outline' : 'albums-outline'}
                message={
                  query
                    ? 'Try another card name.'
                    : `Import cards into your ${listKind === 'haves' ? 'trade binder' : 'want list'}.`
                }
                title={query ? 'No matching cards' : `No ${listKind} yet`}
              />
            }
            refreshControl={
              <RefreshControl
                onRefresh={refresh}
                refreshing={isLoading}
                tintColor={colors.accent}
              />
            }
            renderItem={({ item }) => <CardRow card={item} onPress={() => openCard(item)} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
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
  importButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  importButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  listHeader: {
    marginBottom: spacing.md,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  searchContainer: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: typeScale.body,
    minHeight: 44,
  },
  segment: {
    alignItems: 'center',
    borderRadius: radii.sm,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  segmentActive: {
    backgroundColor: colors.accent,
  },
  segmentedControl: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    flexDirection: 'row',
    padding: spacing.xs,
  },
  segmentText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: colors.background,
  },
  separator: {
    backgroundColor: colors.border,
    height: hairline,
    // Indented past the thumbnail so the rule aligns with the card name.
    marginLeft: 46,
  },
  toolbar: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
});
