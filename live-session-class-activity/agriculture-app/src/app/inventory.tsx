import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { AccessibilityInfo, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTextInput, FormField } from '@/components/form-controls';
import { FormModal } from '@/components/form-modal';
import { ScreenState } from '@/components/screen-state';
import { colors, radii, spacing } from '@/constants/theme';
import { createSupply, deleteSupply, listSupplies, updateSupply, type SupplyInput, type SupplyItem } from '@/features/inventory/repository';
import { fieldError } from '@/utils/validation';

const emptyDraft = (): SupplyInput => ({ name: '', category: '', unit: '', quantity: '' });

export default function InventoryScreen() {
  const db = useSQLiteContext();
  const [items, setItems] = useState<SupplyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<SupplyItem | null>(null);
  const [draft, setDraft] = useState<SupplyInput | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [refreshNeeded, setRefreshNeeded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (propagate = false) => {
    setError(null);
    try {
      setItems(await listSupplies(db));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not load inventory.');
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

  const openEdit = (item: SupplyItem) => {
    setEditing(item);
    setDraft({ name: item.name, category: item.category, unit: item.unit, quantity: String(item.quantity) });
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
        if (editing) await updateSupply(db, editing.id, draft);
        else await createSupply(db, draft);
        writeCompleted = true;
      }
      await load(true);
      closeForm();
      AccessibilityInfo.announceForAccessibility(editing ? 'Supply saved.' : 'Supply added.');
    } catch (nextError) {
      if (writeCompleted) {
        setRefreshNeeded(true);
        setFormError('Your supply was saved locally, but the list could not refresh. Retry refresh before making another change.');
      } else {
        setFormError(nextError instanceof Error ? nextError.message : 'Could not save supply.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (item: SupplyItem) => {
    Alert.alert('Delete supply?', `Delete ${item.name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            let deleted = false;
            try {
              await deleteSupply(db, item.id);
              deleted = true;
              await load(true);
              AccessibilityInfo.announceForAccessibility('Supply deleted.');
            } catch (nextError) {
              Alert.alert(deleted ? 'Supply deleted, refresh needed' : 'Supply not deleted', deleted ? 'The supply was deleted locally, but the list could not refresh. Try reloading the screen.' : nextError instanceof Error ? nextError.message : 'Please try again.');
            }
          })();
        },
      },
    ]);
  };

  if (loading) return <View style={styles.screen}><ScreenState title="Loading inventory" message="Reading your saved supplies." loading /></View>;
  if (error && items.length === 0) return <View style={styles.screen}><ScreenState title="Inventory unavailable" message={error} tone="error" actionLabel="Try again" onAction={() => void load()} /></View>;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.headingCopy}>
            <Text accessibilityRole="header" style={styles.title}>Supplies</Text>
            <Text style={styles.subtitle}>Local inventory stays available offline.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Add supply" onPress={openNew} style={styles.addButton}><Text style={styles.addButtonText}>Add supply</Text></Pressable>
        </View>
        {error ? <Text accessibilityRole="alert" style={styles.inlineError}>{error}</Text> : null}
        {items.length === 0 ? (
          <ScreenState title="No supplies yet" message="Add seed, feed, tools, or any other supply you need to track." actionLabel="Add supply" onAction={openNew} />
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
              <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Edit ${item.name}`} onPress={() => openEdit(item)} style={styles.item}>
                <View style={styles.itemCopy}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>{item.category}</Text>
                </View>
                <View style={styles.quantityWrap}>
                  <Text style={styles.quantity}>{item.quantity} {item.unit}</Text>
                  <Text style={styles.editText}>Edit</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <FormModal visible={Boolean(draft)} title={editing ? `Edit ${editing.name}` : 'Add supply'} submitLabel={refreshNeeded ? 'Retry refresh' : 'Save supply'} submitting={submitting} error={formError} onClose={closeForm} onSubmit={() => void submit()}>
        {draft && !refreshNeeded ? <>
          <FormField label="Supply name" error={fieldError(formError, 'supply name')}><AppTextInput value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} accessibilityLabel="Supply name" autoFocus /></FormField>
          <FormField label="Category" error={fieldError(formError, 'category')}><AppTextInput value={draft.category} onChangeText={(category) => setDraft({ ...draft, category })} accessibilityLabel="Supply category" placeholder="e.g., Seed, Feed, Repair" /></FormField>
          <FormField label="Quantity" error={fieldError(formError, 'quantity')}><AppTextInput value={String(draft.quantity)} onChangeText={(quantity) => setDraft({ ...draft, quantity })} accessibilityLabel="Quantity" keyboardType="decimal-pad" /></FormField>
          <FormField label="Unit" error={fieldError(formError, 'unit')}><AppTextInput value={draft.unit} onChangeText={(unit) => setDraft({ ...draft, unit })} accessibilityLabel="Quantity unit" placeholder="e.g., bags, gallons, lb" /></FormField>
          {editing ? <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${editing.name}`} onPress={() => { closeForm(); confirmDelete(editing); }} style={styles.deleteButton}><Text style={styles.deleteText}>Delete supply</Text></Pressable> : null}
        </> : null}
      </FormModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headingCopy: { flex: 1, gap: spacing.xs },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.mutedText, fontSize: 14, lineHeight: 20 },
  addButton: { minHeight: 44, paddingHorizontal: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary, justifyContent: 'center' },
  addButtonText: { color: colors.surface, fontWeight: '700' },
  inlineError: { color: colors.danger, backgroundColor: colors.dangerSoft, borderRadius: radii.sm, padding: spacing.md },
  list: { gap: spacing.sm },
  item: { minHeight: 76, padding: spacing.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radii.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  itemCopy: { flex: 1, gap: spacing.xs },
  itemName: { color: colors.text, fontWeight: '700', fontSize: 17 },
  itemMeta: { color: colors.mutedText, fontSize: 14 },
  quantityWrap: { alignItems: 'flex-end', gap: spacing.xs },
  quantity: { color: colors.primaryDark, fontWeight: '700', fontSize: 15 },
  editText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  deleteButton: { minHeight: 44, borderWidth: 1, borderColor: colors.danger, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: colors.danger, fontWeight: '700' },
});
