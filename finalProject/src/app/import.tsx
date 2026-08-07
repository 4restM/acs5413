import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Button,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CardRow } from '@/components/card-row';
import { colors, radii, spacing, typeScale } from '@/constants/theme';
import { useBinder } from '@/context/binder-context';
import { buildBinderCards } from '@/lib/binder';
import { getErrorMessage } from '@/lib/errors';
import { parseCardList } from '@/lib/parse-list';
import { resolveCardMetadata } from '@/lib/scryfall';
import type { BinderCard, BinderListKind, CardListEntry } from '@/types/card';

type Preview = {
  cards: BinderCard[];
  notFound: CardListEntry[];
  skippedCount: number;
  cacheHits: number;
  networkRequests: number;
};

export default function ImportScreen() {
  const params = useLocalSearchParams<{ listKind?: string }>();
  const { importCards } = useBinder();
  const [listKind, setListKind] = useState<BinderListKind>(
    params.listKind === 'wants' ? 'wants' : 'haves'
  );
  const [listText, setListText] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function changeListText(value: string) {
    setListText(value);
    setPreview(null);
    setErrorMessage(null);
  }

  async function parseAndResolve() {
    const parsed = parseCardList(listText);
    if (parsed.cards.length === 0) {
      setErrorMessage('Paste at least one card line before validating.');
      return;
    }

    setIsResolving(true);
    setErrorMessage(null);
    try {
      const resolved = await resolveCardMetadata(parsed.cards);
      setPreview({
        cards: buildBinderCards(parsed.cards, resolved.cards),
        notFound: resolved.notFound,
        skippedCount: parsed.skippedLines.length,
        cacheHits: resolved.cacheHits,
        networkRequests: resolved.networkRequests,
      });
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, 'The card list could not be processed.'));
    } finally {
      setIsResolving(false);
    }
  }

  async function commitImport() {
    if (!preview?.cards.length) return;

    setIsSaving(true);
    setErrorMessage(null);
    try {
      await importCards(listKind, preview.cards);
      router.back();
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, 'The cards could not be imported.'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.description}>
          Paste a Moxfield, Arena, MTGO, or plain card list. Re-importing updates the same
          Firebase keys instead of creating duplicates.
        </Text>

        <View style={styles.segmentedControl}>
          {(['haves', 'wants'] as const).map((kind) => (
            <Pressable
              key={kind}
              disabled={isSaving}
              onPress={() => setListKind(kind)}
              style={[styles.segment, listKind === kind && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, listKind === kind && styles.segmentTextActive]}>
                {kind === 'haves' ? 'Haves' : 'Wants'}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          autoCapitalize="words"
          editable={!isResolving && !isSaving}
          multiline
          onChangeText={changeListText}
          placeholder={'4 Lightning Bolt\n2 Counterspell (2XM) 50\n1 Sol Ring'}
          placeholderTextColor={colors.textMuted}
          style={styles.textArea}
          textAlignVertical="top"
          value={listText}
        />

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <View style={styles.buttonRow}>
          <Button color={colors.textMuted} onPress={() => router.back()} title="Cancel" />
          <Button
            color={colors.accent}
            disabled={isResolving || isSaving || !listText.trim()}
            onPress={parseAndResolve}
            title={preview ? 'Validate again' : 'Validate list'}
          />
        </View>

        {isResolving ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={styles.mutedText}>Checking cache and resolving Scryfall cards…</Text>
          </View>
        ) : null}

        {preview ? (
          <View style={styles.previewSection}>
            <Text style={styles.previewTitle}>Import preview</Text>
            <Text style={styles.mutedText}>
              {preview.cards.length} found · {preview.cacheHits} cached · {preview.networkRequests}{' '}
              Scryfall request{preview.networkRequests === 1 ? '' : 's'}
            </Text>

            {preview.notFound.length > 0 ? (
              <View style={styles.warningCard}>
                <Text style={styles.warningTitle}>Couldn’t find {preview.notFound.length}</Text>
                <Text style={styles.warningText}>
                  {preview.notFound.map((card) => card.name).join(', ')}
                </Text>
              </View>
            ) : null}

            {preview.skippedCount > 0 ? (
              <Text style={styles.warningText}>{preview.skippedCount} malformed lines skipped.</Text>
            ) : null}

            <View style={styles.previewList}>
              {preview.cards.slice(0, 12).map((card) => (
                <CardRow card={card} key={card.cardKey} />
              ))}
            </View>
            {preview.cards.length > 12 ? (
              <Text style={styles.mutedText}>And {preview.cards.length - 12} more cards…</Text>
            ) : null}

            <Pressable
              disabled={isSaving || preview.cards.length === 0}
              onPress={commitImport}
              style={({ pressed }) => [
                styles.commitButton,
                (pressed || isSaving) && styles.commitButtonPressed,
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.commitButtonText}>
                  Import {preview.cards.length} into {listKind === 'haves' ? 'Haves' : 'Wants'}
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  commitButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    justifyContent: 'center',
    marginTop: spacing.lg,
    minHeight: 50,
    paddingHorizontal: spacing.lg,
  },
  commitButtonPressed: {
    opacity: 0.7,
  },
  commitButtonText: {
    color: colors.background,
    fontSize: typeScale.body,
    fontWeight: '600',
  },
  container: {
    backgroundColor: colors.background,
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: 48,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: spacing.lg,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  keyboardView: {
    backgroundColor: colors.background,
    flex: 1,
  },
  loading: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  mutedText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  previewList: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  previewSection: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
  },
  previewTitle: {
    color: colors.text,
    fontSize: typeScale.subtitle,
    fontWeight: '600',
    marginBottom: spacing.xs,
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
    marginBottom: spacing.md,
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
  textArea: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: typeScale.body,
    lineHeight: 23,
    minHeight: 220,
    padding: spacing.md,
  },
  warningCard: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.danger,
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  warningText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  warningTitle: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
});
