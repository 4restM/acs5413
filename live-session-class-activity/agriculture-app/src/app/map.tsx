import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type LongPressEvent, type Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTextInput, ChoiceRow, FormField } from '@/components/form-controls';
import { FormModal } from '@/components/form-modal';
import { ScreenState } from '@/components/screen-state';
import { DEFAULT_REGION_DELTA } from '@/constants/map';
import { colors, radii, spacing } from '@/constants/theme';
import { getFarmSettings, saveFarmSettings, type FarmSettings } from '@/features/farm/repository';
import { createMarker, deleteMarker, listMarkers, updateMarker, type FarmMarker } from '@/features/map/repository';
import { fieldError, MARKER_KINDS, type MarkerKind } from '@/utils/validation';

type MarkerDraft = {
  name: string;
  kind: MarkerKind;
  latitude: string;
  longitude: string;
  notes: string;
};

function toRegion(latitude: number, longitude: number): Region {
  return { latitude, longitude, ...DEFAULT_REGION_DELTA };
}

function emptyDraft(latitude: number, longitude: number): MarkerDraft {
  return { name: '', kind: 'field', latitude: String(latitude), longitude: String(longitude), notes: '' };
}

export default function MapScreen() {
  const db = useSQLiteContext();
  const mapRef = useRef<MapView>(null);
  const [farm, setFarm] = useState<FarmSettings | null>(null);
  const [markers, setMarkers] = useState<FarmMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [visibleCenter, setVisibleCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [placementMode, setPlacementMode] = useState(false);
  const [editingMarker, setEditingMarker] = useState<FarmMarker | null>(null);
  const [draft, setDraft] = useState<MarkerDraft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [refreshNeeded, setRefreshNeeded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (propagate = false) => {
    setError(null);
    try {
      const [nextFarm, nextMarkers] = await Promise.all([getFarmSettings(db), listMarkers(db)]);
      setFarm(nextFarm);
      setMarkers(nextMarkers);
      setVisibleCenter((center) => center ?? { latitude: nextFarm.latitude, longitude: nextFarm.longitude });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not load farm markers.');
      if (propagate) throw nextError;
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  useEffect(() => {
    if (farm && mapReady) mapRef.current?.animateToRegion(toRegion(farm.latitude, farm.longitude), 350);
  }, [farm, mapReady]);

  const openNewMarker = () => {
    setPlacementMode(true);
    setEditingMarker(null);
    setDraft(null);
    setFormError(null);
    setRefreshNeeded(false);
  };

  const openEditMarker = (marker: FarmMarker) => {
    setPlacementMode(false);
    setEditingMarker(marker);
    setDraft({ name: marker.name, kind: marker.kind, latitude: String(marker.latitude), longitude: String(marker.longitude), notes: marker.notes });
    setFormError(null);
    setRefreshNeeded(false);
  };

  const onMapLongPress = (event: LongPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setPlacementMode(false);
    setEditingMarker(null);
    setDraft(emptyDraft(latitude, longitude));
    setFormError(null);
    setRefreshNeeded(false);
  };

  const closeForm = () => {
    setDraft(null);
    setEditingMarker(null);
    setPlacementMode(false);
    setFormError(null);
    setRefreshNeeded(false);
  };

  const submitMarker = async () => {
    if (!draft) return;
    setSubmitting(true);
    setFormError(null);
    let writeCompleted = refreshNeeded;
    try {
      const wasEditing = Boolean(editingMarker);
      if (!refreshNeeded) {
        if (editingMarker) await updateMarker(db, editingMarker.id, draft);
        else await createMarker(db, draft);
        writeCompleted = true;
      }
      await load(true);
      closeForm();
      AccessibilityInfo.announceForAccessibility(wasEditing ? 'Marker saved.' : 'Marker added.');
    } catch (nextError) {
      if (writeCompleted) {
        setRefreshNeeded(true);
        setFormError('Your marker was saved locally, but the marker list could not refresh. Retry refresh before making another change.');
      } else {
        setFormError(nextError instanceof Error ? nextError.message : 'Could not save marker.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (marker: FarmMarker) => {
    Alert.alert('Delete marker?', `Delete ${marker.name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            let deleted = false;
            try {
              await deleteMarker(db, marker);
              deleted = true;
              await load(true);
              AccessibilityInfo.announceForAccessibility('Marker deleted.');
            } catch (nextError) {
              Alert.alert(deleted ? 'Marker deleted, refresh needed' : 'Marker not deleted', deleted ? 'The marker was deleted locally, but the marker list could not refresh. Try reloading the screen.' : nextError instanceof Error ? nextError.message : 'Please try again.');
            }
          })();
        },
      },
    ]);
  };

  const saveVisibleCenter = async () => {
    if (!farm || !visibleCenter) return;
    let saved = false;
    try {
      await saveFarmSettings(db, { farmName: farm.farm_name, ...visibleCenter });
      saved = true;
      await load(true);
      AccessibilityInfo.announceForAccessibility('Farm center saved. Weather cache cleared.');
    } catch (nextError) {
      Alert.alert(saved ? 'Farm center saved, refresh needed' : 'Farm center not saved', saved ? 'The farm center and weather-cache change were saved locally, but the map could not refresh. Try reloading the screen.' : nextError instanceof Error ? nextError.message : 'Please try again.');
    }
  };

  const focusFarm = () => {
    if (!farm) return;
    mapRef.current?.animateToRegion(toRegion(farm.latitude, farm.longitude), 350);
  };

  if (loading && !farm) {
    return <View style={styles.screen}><ScreenState title="Loading farm map" message="Opening your saved farm markers." loading /></View>;
  }
  if (error && !farm) {
    return <View style={styles.screen}><ScreenState title="Farm map unavailable" message={error} actionLabel="Try again" onAction={() => void load()} tone="error" /></View>;
  }
  if (!farm) return null;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mapShell}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={toRegion(farm.latitude, farm.longitude)}
            onMapReady={() => setMapReady(true)}
            onLongPress={onMapLongPress}
            onRegionChangeComplete={(region) => setVisibleCenter({ latitude: region.latitude, longitude: region.longitude })}
            accessibilityLabel="Farm map. Long press to choose a marker location.">
            {markers.map((marker) => (
              <Marker key={marker.id} coordinate={{ latitude: marker.latitude, longitude: marker.longitude }} title={marker.name} description={marker.kind} onPress={() => openEditMarker(marker)} />
            ))}
          </MapView>
        </View>

        <Text style={styles.mapHint}>{placementMode ? 'Placement mode is on: long press the map to choose the marker location.' : 'Long press the map to add a marker, or use the visible Add Marker action.'}</Text>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Add map marker" onPress={openNewMarker} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Add Marker</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Save visible map center as farm" onPress={() => void saveVisibleCenter()} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Save visible center as farm</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Focus saved farm center" onPress={focusFarm} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Focus Farm</Text>
          </Pressable>
        </View>

        <View style={styles.listHeader}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>Saved markers</Text>
          <Text style={styles.sectionSubtitle}>This list remains available when map tiles are unavailable.</Text>
        </View>
        {error ? <Text accessibilityRole="alert" style={styles.inlineError}>{error}</Text> : null}
        {markers.length === 0 ? (
          <ScreenState title="No markers yet" message="Add a field, equipment, storage area, or other farm location." actionLabel="Add Marker" onAction={openNewMarker} />
        ) : (
          <View style={styles.markerList}>
            {markers.map((marker) => (
              <Pressable key={marker.id} accessibilityRole="button" accessibilityLabel={`Edit ${marker.name}, ${marker.kind}`} onPress={() => openEditMarker(marker)} style={styles.markerRow}>
                <View style={styles.markerCopy}>
                  <Text style={styles.markerName}>{marker.name}</Text>
                  <Text style={styles.markerMeta}>{marker.kind} · {marker.latitude.toFixed(4)}, {marker.longitude.toFixed(4)}</Text>
                  {marker.notes ? <Text style={styles.markerNotes}>{marker.notes}</Text> : null}
                </View>
                <Text style={styles.editText}>Edit</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <FormModal
        visible={Boolean(draft)}
        title={editingMarker ? `Edit ${editingMarker.name}` : 'Add marker'}
        submitLabel={refreshNeeded ? 'Retry refresh' : 'Save marker'}
        submitting={submitting}
        error={formError}
        onClose={closeForm}
        onSubmit={() => void submitMarker()}>
        {draft && !refreshNeeded ? <>
          <FormField label="Marker name" error={fieldError(formError, 'marker name')}><AppTextInput value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} accessibilityLabel="Marker name" autoFocus /></FormField>
          <FormField label="Type" error={fieldError(formError, 'marker type')}><ChoiceRow value={draft.kind} choices={MARKER_KINDS} onChange={(kind) => setDraft({ ...draft, kind: kind as MarkerKind })} accessibilityLabel="Marker type" /></FormField>
          <FormField label="Latitude" error={fieldError(formError, 'latitude')}><AppTextInput value={draft.latitude} onChangeText={(latitude) => setDraft({ ...draft, latitude })} accessibilityLabel="Latitude" keyboardType="decimal-pad" /></FormField>
          <FormField label="Longitude" error={fieldError(formError, 'longitude')}><AppTextInput value={draft.longitude} onChangeText={(longitude) => setDraft({ ...draft, longitude })} accessibilityLabel="Longitude" keyboardType="decimal-pad" /></FormField>
          <FormField label="Notes (optional)"><AppTextInput value={draft.notes} onChangeText={(notes) => setDraft({ ...draft, notes })} accessibilityLabel="Marker notes" multiline /></FormField>
          {editingMarker ? <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${editingMarker.name}`} onPress={() => { closeForm(); confirmDelete(editingMarker); }} style={styles.deleteButton}><Text style={styles.deleteText}>Delete marker</Text></Pressable> : null}
        </> : null}
      </FormModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  mapShell: { height: 300, overflow: 'hidden', borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border },
  map: { flex: 1 },
  mapHint: { color: colors.mutedText, fontSize: 14, lineHeight: 20 },
  actions: { gap: spacing.sm },
  primaryButton: { minHeight: 48, borderRadius: radii.md, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary },
  primaryButtonText: { color: colors.surface, fontSize: 16, fontWeight: '700' },
  secondaryButton: { minHeight: 46, borderRadius: radii.md, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.primary },
  secondaryButtonText: { color: colors.primaryDark, fontWeight: '700', textAlign: 'center', paddingHorizontal: spacing.md },
  listHeader: { gap: spacing.xs, marginTop: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 21, fontWeight: '800' },
  sectionSubtitle: { color: colors.mutedText, fontSize: 14, lineHeight: 20 },
  inlineError: { color: colors.danger, backgroundColor: colors.dangerSoft, borderRadius: radii.sm, padding: spacing.md },
  markerList: { gap: spacing.sm },
  markerRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  markerCopy: { flex: 1, gap: spacing.xs },
  markerName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  markerMeta: { color: colors.primaryDark, fontSize: 13, textTransform: 'capitalize' },
  markerNotes: { color: colors.mutedText, fontSize: 13 },
  editText: { color: colors.primary, fontWeight: '700' },
  deleteButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.danger, borderRadius: radii.md },
  deleteText: { color: colors.danger, fontWeight: '700' },
});
