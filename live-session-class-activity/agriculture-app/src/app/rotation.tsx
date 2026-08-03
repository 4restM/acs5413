import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTextInput, ChoiceRow, FormField } from '@/components/form-controls';
import { FormModal } from '@/components/form-modal';
import { ScreenState } from '@/components/screen-state';
import { colors, radii, spacing } from '@/constants/theme';
import { listFieldMarkers, type FarmMarker } from '@/features/map/repository';
import { createCropCycle, deleteCropCycle, listCropCycles, updateCropCycle, type CropCycle, type CropCycleInput } from '@/features/rotation/repository';
import { CROP_STATUSES, fieldError, type CropStatus } from '@/utils/validation';

const emptyDraft = (fieldMarkerId: number): CropCycleInput => ({
  fieldMarkerId,
  cropName: '',
  season: '',
  year: String(new Date().getFullYear()),
  status: 'planned',
  notes: '',
});

export default function RotationScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [fields, setFields] = useState<FarmMarker[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [cycles, setCycles] = useState<CropCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CropCycle | null>(null);
  const [draft, setDraft] = useState<CropCycleInput | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [refreshNeeded, setRefreshNeeded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (propagate = false) => {
    setError(null);
    try {
      const nextFields = await listFieldMarkers(db);
      setFields(nextFields);
      const nextSelectedId = nextFields.find((field) => field.id === selectedFieldId)?.id ?? nextFields[0]?.id ?? null;
      setSelectedFieldId(nextSelectedId);
      setCycles(nextSelectedId ? await listCropCycles(db, nextSelectedId) : []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not load plant rotation.');
      if (propagate) throw nextError;
    } finally {
      setLoading(false);
    }
  }, [db, selectedFieldId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  useEffect(() => {
    if (!selectedFieldId) return;
    void (async () => {
      try {
        setCycles(await listCropCycles(db, selectedFieldId));
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : 'Could not load crop cycles.');
      }
    })();
  }, [db, selectedFieldId]);

  const openNew = () => {
    if (!selectedFieldId) return;
    setEditing(null);
    setDraft(emptyDraft(selectedFieldId));
    setFormError(null);
    setRefreshNeeded(false);
  };

  const openEdit = (cycle: CropCycle) => {
    setEditing(cycle);
    setDraft({ fieldMarkerId: cycle.field_marker_id, cropName: cycle.crop_name, season: cycle.season, year: String(cycle.year), status: cycle.status, notes: cycle.notes });
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
        if (editing) await updateCropCycle(db, editing.id, draft);
        else await createCropCycle(db, draft);
        writeCompleted = true;
      }
      await load(true);
      closeForm();
      AccessibilityInfo.announceForAccessibility(editing ? 'Crop cycle saved.' : 'Crop cycle added.');
    } catch (nextError) {
      if (writeCompleted) {
        setRefreshNeeded(true);
        setFormError('Your crop cycle was saved locally, but the field history could not refresh. Retry refresh before making another change.');
      } else {
        setFormError(nextError instanceof Error ? nextError.message : 'Could not save crop cycle.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (cycle: CropCycle) => {
    Alert.alert('Delete crop cycle?', `Delete ${cycle.crop_name} for ${cycle.season} ${cycle.year}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          void (async () => {
            let deleted = false;
            try {
              await deleteCropCycle(db, cycle.id);
              deleted = true;
              await load(true);
              AccessibilityInfo.announceForAccessibility('Crop cycle deleted.');
            } catch (nextError) {
              Alert.alert(deleted ? 'Crop cycle deleted, refresh needed' : 'Crop cycle not deleted', deleted ? 'The crop cycle was deleted locally, but the field history could not refresh. Try reloading the screen.' : nextError instanceof Error ? nextError.message : 'Please try again.');
            }
          })();
        },
      },
    ]);
  };

  if (loading) return <View style={styles.screen}><ScreenState title="Loading plant rotation" message="Opening field crop history." loading /></View>;
  if (error && fields.length === 0) return <View style={styles.screen}><ScreenState title="Plant rotation unavailable" message={error} tone="error" actionLabel="Try again" onAction={() => void load()} /></View>;

  const selectedField = fields.find((field) => field.id === selectedFieldId) ?? null;
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>Plant Rotation</Text>
          <Text style={styles.subtitle}>Record what was planted in each saved field.</Text>
        </View>
        {error ? <Text accessibilityRole="alert" style={styles.inlineError}>{error}</Text> : null}
        {fields.length === 0 ? (
          <ScreenState title="Add a field first" message="Plant rotation is tied to Farm Map markers whose type is Field." actionLabel="Go to Farm Map" onAction={() => router.push('/map')} />
        ) : <>
          <View style={styles.fieldSelector} accessibilityRole="radiogroup">
            <Text style={styles.fieldLabel}>Selected field</Text>
            {fields.map((field) => {
              const selected = field.id === selectedFieldId;
              return <Pressable key={field.id} accessibilityRole="radio" accessibilityLabel={field.name} accessibilityState={{ selected }} onPress={() => setSelectedFieldId(field.id)} style={[styles.fieldChoice, selected && styles.fieldChoiceSelected]}>
                <Text style={[styles.fieldChoiceText, selected && styles.fieldChoiceTextSelected]}>{field.name}</Text>
                <Text style={[styles.fieldChoiceMeta, selected && styles.fieldChoiceTextSelected]}>{field.latitude.toFixed(3)}, {field.longitude.toFixed(3)}</Text>
              </Pressable>;
            })}
          </View>
          <View style={styles.titleRow}>
            <View style={styles.headingCopy}>
              <Text accessibilityRole="header" style={styles.cycleTitle}>{selectedField?.name ?? 'Crop cycles'}</Text>
              <Text style={styles.subtitle}>Newest cycles appear first.</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Add crop cycle" onPress={openNew} style={styles.addButton}><Text style={styles.addButtonText}>Add cycle</Text></Pressable>
          </View>
          {cycles.length === 0 ? <ScreenState title="No crop cycles yet" message="Add a planned, growing, or completed crop cycle for this field." actionLabel="Add cycle" onAction={openNew} /> : (
            <View style={styles.list}>
              {cycles.map((cycle) => <Pressable key={cycle.id} accessibilityRole="button" accessibilityLabel={`Edit ${cycle.crop_name}, ${cycle.season} ${cycle.year}`} onPress={() => openEdit(cycle)} style={styles.cycle}>
                <View style={styles.cycleCopy}>
                  <Text style={styles.cycleName}>{cycle.crop_name}</Text>
                  <Text style={styles.cycleMeta}>{cycle.season} {cycle.year} · {cycle.status}</Text>
                  {cycle.notes ? <Text style={styles.cycleNotes}>{cycle.notes}</Text> : null}
                </View>
                <Text style={styles.editText}>Edit</Text>
              </Pressable>)}
            </View>
          )}
        </>}
      </ScrollView>

      <FormModal visible={Boolean(draft)} title={editing ? `Edit ${editing.crop_name}` : 'Add crop cycle'} submitLabel={refreshNeeded ? 'Retry refresh' : 'Save crop cycle'} submitting={submitting} error={formError} onClose={closeForm} onSubmit={() => void submit()}>
        {draft && !refreshNeeded ? <>
          <FormField label="Field" error={fieldError(formError, 'field')}><View style={styles.formFields}>{fields.map((field) => { const selected = Number(draft.fieldMarkerId) === field.id; return <Pressable key={field.id} accessibilityRole="radio" accessibilityLabel={field.name} accessibilityState={{ selected }} onPress={() => setDraft({ ...draft, fieldMarkerId: field.id })} style={[styles.formFieldChoice, selected && styles.formFieldChoiceSelected]}><Text style={[styles.formFieldChoiceText, selected && styles.formFieldChoiceTextSelected]}>{field.name}</Text></Pressable>; })}</View></FormField>
          <FormField label="Crop name" error={fieldError(formError, 'crop name')}><AppTextInput value={draft.cropName} onChangeText={(cropName) => setDraft({ ...draft, cropName })} accessibilityLabel="Crop name" autoFocus /></FormField>
          <FormField label="Season" error={fieldError(formError, 'season')}><AppTextInput value={draft.season} onChangeText={(season) => setDraft({ ...draft, season })} accessibilityLabel="Season" placeholder="e.g., Spring" /></FormField>
          <FormField label="Year" error={fieldError(formError, 'year')}><AppTextInput value={String(draft.year)} onChangeText={(year) => setDraft({ ...draft, year })} accessibilityLabel="Year" keyboardType="number-pad" /></FormField>
          <FormField label="Status" error={fieldError(formError, 'status')}><ChoiceRow value={draft.status} choices={CROP_STATUSES} onChange={(status) => setDraft({ ...draft, status: status as CropStatus })} accessibilityLabel="Crop status" /></FormField>
          <FormField label="Notes (optional)"><AppTextInput value={draft.notes ?? ''} onChangeText={(notes) => setDraft({ ...draft, notes })} accessibilityLabel="Crop cycle notes" multiline /></FormField>
          {editing ? <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${editing.crop_name}`} onPress={() => { closeForm(); confirmDelete(editing); }} style={styles.deleteButton}><Text style={styles.deleteText}>Delete crop cycle</Text></Pressable> : null}
        </> : null}
      </FormModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  heading: { gap: spacing.xs },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.mutedText, fontSize: 14, lineHeight: 20 },
  inlineError: { color: colors.danger, backgroundColor: colors.dangerSoft, borderRadius: radii.sm, padding: spacing.md },
  fieldSelector: { gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, backgroundColor: colors.surface },
  fieldLabel: { color: colors.text, fontSize: 15, fontWeight: '700' },
  fieldChoice: { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, padding: spacing.sm, justifyContent: 'center' },
  fieldChoiceSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  fieldChoiceText: { color: colors.text, fontWeight: '700' },
  fieldChoiceTextSelected: { color: colors.primaryDark },
  fieldChoiceMeta: { color: colors.mutedText, fontSize: 12, marginTop: 2 },
  titleRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  headingCopy: { flex: 1, gap: spacing.xs },
  cycleTitle: { color: colors.text, fontSize: 21, fontWeight: '800' },
  addButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary },
  addButtonText: { color: colors.surface, fontWeight: '700' },
  list: { gap: spacing.sm },
  cycle: { minHeight: 78, padding: spacing.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radii.md, flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  cycleCopy: { flex: 1, gap: spacing.xs },
  cycleName: { color: colors.text, fontSize: 17, fontWeight: '700' },
  cycleMeta: { color: colors.primaryDark, fontSize: 14, textTransform: 'capitalize' },
  cycleNotes: { color: colors.mutedText, fontSize: 13 },
  editText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  formFields: { gap: spacing.sm },
  formFieldChoice: { minHeight: 42, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, justifyContent: 'center', paddingHorizontal: spacing.md },
  formFieldChoiceSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  formFieldChoiceText: { color: colors.text, fontWeight: '600' },
  formFieldChoiceTextSelected: { color: colors.primaryDark },
  deleteButton: { minHeight: 44, borderWidth: 1, borderColor: colors.danger, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: colors.danger, fontWeight: '700' },
});
