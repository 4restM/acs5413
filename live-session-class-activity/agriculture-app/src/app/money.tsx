import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { AccessibilityInfo, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTextInput, ChoiceRow, FormField } from '@/components/form-controls';
import { FormModal } from '@/components/form-modal';
import { ScreenState } from '@/components/screen-state';
import { colors, radii, spacing } from '@/constants/theme';
import { createCashEntry, deleteCashEntry, getBalanceCents, listCashEntries, updateCashEntry, type CashEntry, type CashEntryInput } from '@/features/money/repository';
import { formatCurrency } from '@/utils/currency';
import { CASH_KINDS, fieldError, type CashKind } from '@/utils/validation';

const today = () => new Date().toISOString().slice(0, 10);
const emptyDraft = (): CashEntryInput => ({ kind: 'expense', amount: '', category: '', occurredOn: today(), note: '' });

export default function MoneyScreen() {
  const db = useSQLiteContext();
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CashEntry | null>(null);
  const [draft, setDraft] = useState<CashEntryInput | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [refreshNeeded, setRefreshNeeded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (propagate = false) => {
    setError(null);
    try {
      const [nextEntries, nextBalance] = await Promise.all([listCashEntries(db), getBalanceCents(db)]);
      setEntries(nextEntries);
      setBalance(nextBalance);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not load the ledger.');
      if (propagate) throw nextError;
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const openNew = () => {
    setEditing(null);
    setDraft(emptyDraft());
    setFormError(null);
    setRefreshNeeded(false);
  };

  const openEdit = (entry: CashEntry) => {
    setEditing(entry);
    setDraft({ kind: entry.kind, amount: (entry.amount_cents / 100).toFixed(2), category: entry.category, occurredOn: entry.occurred_on, note: entry.note });
    setFormError(null);
    setRefreshNeeded(false);
  };

  const closeForm = () => {
    setEditing(null);
    setDraft(null);
    setFormError(null);
    setRefreshNeeded(false);
  };

  const submit = async () => {
    if (!draft) return;
    setSubmitting(true);
    setFormError(null);
    let writeCompleted = refreshNeeded;
    try {
      if (!refreshNeeded) {
        if (editing) await updateCashEntry(db, editing.id, draft);
        else await createCashEntry(db, draft);
        writeCompleted = true;
      }
      await load(true);
      closeForm();
      AccessibilityInfo.announceForAccessibility(editing ? 'Ledger entry saved.' : 'Ledger entry added.');
    } catch (nextError) {
      if (writeCompleted) {
        setRefreshNeeded(true);
        setFormError('Your ledger entry was saved locally, but the ledger could not refresh. Retry refresh before making another change.');
      } else {
        setFormError(nextError instanceof Error ? nextError.message : 'Could not save ledger entry.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (entry: CashEntry) => {
    Alert.alert('Delete ledger entry?', `Delete this ${entry.kind} of ${formatCurrency(entry.amount_cents)}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        void (async () => {
          let deleted = false;
          try {
            await deleteCashEntry(db, entry.id);
            deleted = true;
            await load(true);
            AccessibilityInfo.announceForAccessibility('Ledger entry deleted.');
          } catch (nextError) {
            Alert.alert(deleted ? 'Entry deleted, refresh needed' : 'Entry not deleted', deleted ? 'The entry was deleted locally, but the ledger could not refresh. Try reloading the screen.' : nextError instanceof Error ? nextError.message : 'Please try again.');
          }
        })();
      } },
    ]);
  };

  if (loading) return <View style={styles.screen}><ScreenState title="Loading ledger" message="Calculating the current farm balance." loading /></View>;
  if (error && entries.length === 0) return <View style={styles.screen}><ScreenState title="Ledger unavailable" message={error} tone="error" actionLabel="Try again" onAction={() => void load()} /></View>;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.headingCopy}>
            <Text accessibilityRole="header" style={styles.title}>Money In / Out</Text>
            <Text style={styles.subtitle}>A simple local ledger for farm cash flow.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Add ledger entry" onPress={openNew} style={styles.addButton}><Text style={styles.addButtonText}>Add entry</Text></Pressable>
        </View>
        <View style={styles.balanceCard} accessibilityLabel={`Current balance ${formatCurrency(balance)}`}>
          <Text style={styles.balanceLabel}>Current balance</Text>
          <Text style={[styles.balance, balance < 0 && styles.negativeBalance]}>{formatCurrency(balance)}</Text>
          <Text style={styles.balanceHint}>Income minus expenses</Text>
        </View>
        {error ? <Text accessibilityRole="alert" style={styles.inlineError}>{error}</Text> : null}
        <Text accessibilityRole="header" style={styles.ledgerTitle}>Ledger</Text>
        {entries.length === 0 ? (
          <ScreenState title="No money entries yet" message="Add income or an expense to begin tracking the farm balance." actionLabel="Add entry" onAction={openNew} />
        ) : (
          <View style={styles.list}>
            {entries.map((entry) => <Pressable key={entry.id} accessibilityRole="button" accessibilityLabel={`Edit ${entry.kind}: ${entry.category}, ${formatCurrency(entry.amount_cents)}`} onPress={() => openEdit(entry)} style={styles.entry}>
              <View style={styles.entryCopy}>
                <Text style={styles.entryCategory}>{entry.category}</Text>
                <Text style={styles.entryMeta}>{entry.occurred_on} · {entry.kind}</Text>
                {entry.note ? <Text style={styles.entryNote}>{entry.note}</Text> : null}
              </View>
              <View style={styles.entryAmountWrap}>
                <Text style={[styles.entryAmount, entry.kind === 'income' ? styles.income : styles.expense]}>{entry.kind === 'income' ? '+' : '-'}{formatCurrency(entry.amount_cents)}</Text>
                <Text style={styles.editText}>Edit</Text>
              </View>
            </Pressable>)}
          </View>
        )}
      </ScrollView>

      <FormModal visible={Boolean(draft)} title={editing ? `Edit ${editing.category}` : 'Add ledger entry'} submitLabel={refreshNeeded ? 'Retry refresh' : 'Save entry'} submitting={submitting} error={formError} onClose={closeForm} onSubmit={() => void submit()}>
        {draft && !refreshNeeded ? <>
          <FormField label="Type" error={fieldError(formError, 'income or expense')}><ChoiceRow value={draft.kind} choices={CASH_KINDS} onChange={(kind) => setDraft({ ...draft, kind: kind as CashKind })} accessibilityLabel="Entry type" /></FormField>
          <FormField label="Amount" error={fieldError(formError, 'amount')}><AppTextInput value={draft.amount} onChangeText={(amount) => setDraft({ ...draft, amount })} accessibilityLabel="Amount in dollars" keyboardType="decimal-pad" placeholder="0.00" /></FormField>
          <FormField label="Category" error={fieldError(formError, 'category')}><AppTextInput value={draft.category} onChangeText={(category) => setDraft({ ...draft, category })} accessibilityLabel="Entry category" placeholder="e.g., Feed, Produce sale" /></FormField>
          <FormField label="Date" error={fieldError(formError, 'date')}><AppTextInput value={draft.occurredOn} onChangeText={(occurredOn) => setDraft({ ...draft, occurredOn })} accessibilityLabel="Date" placeholder="YYYY-MM-DD" /></FormField>
          <FormField label="Note (optional)"><AppTextInput value={draft.note ?? ''} onChangeText={(note) => setDraft({ ...draft, note })} accessibilityLabel="Entry note" multiline /></FormField>
          {editing ? <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${editing.category}`} onPress={() => { closeForm(); confirmDelete(editing); }} style={styles.deleteButton}><Text style={styles.deleteText}>Delete entry</Text></Pressable> : null}
        </> : null}
      </FormModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  titleRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  headingCopy: { flex: 1, gap: spacing.xs },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.mutedText, fontSize: 14, lineHeight: 20 },
  addButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary },
  addButtonText: { color: colors.surface, fontWeight: '700' },
  balanceCard: { padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.primaryDark, gap: spacing.xs },
  balanceLabel: { color: '#DCECD9', fontSize: 14, fontWeight: '700' },
  balance: { color: colors.surface, fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  negativeBalance: { color: '#FFD3CC' },
  balanceHint: { color: '#DCECD9', fontSize: 13 },
  inlineError: { color: colors.danger, backgroundColor: colors.dangerSoft, borderRadius: radii.sm, padding: spacing.md },
  ledgerTitle: { color: colors.text, fontSize: 21, fontWeight: '800' },
  list: { gap: spacing.sm },
  entry: { minHeight: 82, padding: spacing.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radii.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  entryCopy: { flex: 1, gap: spacing.xs },
  entryCategory: { color: colors.text, fontSize: 17, fontWeight: '700' },
  entryMeta: { color: colors.mutedText, fontSize: 13, textTransform: 'capitalize' },
  entryNote: { color: colors.mutedText, fontSize: 13 },
  entryAmountWrap: { alignItems: 'flex-end', gap: spacing.xs },
  entryAmount: { fontSize: 15, fontWeight: '800' },
  income: { color: colors.income },
  expense: { color: colors.expense },
  editText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  deleteButton: { minHeight: 44, borderWidth: 1, borderColor: colors.danger, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: colors.danger, fontWeight: '700' },
});
