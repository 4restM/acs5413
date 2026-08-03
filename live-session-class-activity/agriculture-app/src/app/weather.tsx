import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenState } from '@/components/screen-state';
import { colors, radii, spacing } from '@/constants/theme';
import { getFarmSettings, type FarmSettings } from '@/features/farm/repository';
import { weatherDescription } from '@/features/weather/api';
import { getMatchingCache, isCacheFresh, loadWeather } from '@/features/weather/repository';
import type { WeatherState } from '@/features/weather/types';

function cacheAge(fetchedAt: string | null) {
  if (!fetchedAt) return 'No cached forecast';
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(fetchedAt)) / 60_000));
  if (minutes < 1) return 'Updated just now';
  if (minutes === 1) return 'Updated 1 minute ago';
  if (minutes < 60) return `Updated ${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  return `Updated ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
}

export default function WeatherScreen() {
  const db = useSQLiteContext();
  const [farm, setFarm] = useState<FarmSettings | null>(null);
  const [weather, setWeather] = useState<WeatherState>({ snapshot: null, fetchedAt: null, isFresh: false, error: null });
  const [snapshotCoordinates, setSnapshotCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async (forceRefresh = false) => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    if (forceRefresh) setRefreshing(true);
    try {
      const nextFarm = await getFarmSettings(db);
      if (currentRequest !== requestId.current) return;
      setFarm(nextFarm);
      const cached = await getMatchingCache(db, nextFarm.latitude, nextFarm.longitude);
      if (currentRequest !== requestId.current) return;
      if (cached) {
        setWeather({ snapshot: cached.snapshot, fetchedAt: cached.fetchedAt, isFresh: isCacheFresh(cached.fetchedAt), error: null });
        setSnapshotCoordinates({ latitude: nextFarm.latitude, longitude: nextFarm.longitude });
      } else {
        setWeather({ snapshot: null, fetchedAt: null, isFresh: false, error: null });
        setSnapshotCoordinates(null);
      }
      const nextWeather = await loadWeather(db, nextFarm.latitude, nextFarm.longitude, { forceRefresh });
      if (currentRequest !== requestId.current) return;
      setWeather(nextWeather);
      setSnapshotCoordinates(nextWeather.snapshot ? { latitude: nextFarm.latitude, longitude: nextFarm.longitude } : null);
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      setWeather((previous) => ({ ...previous, error: error instanceof Error ? error.message : 'Weather could not be loaded.' }));
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [db]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  if (loading && !farm) return <View style={styles.screen}><ScreenState title="Loading weather" message="Checking the farm forecast and saved cache." loading /></View>;
  if (!farm) return <View style={styles.screen}><ScreenState title="Weather unavailable" message={weather.error ?? 'Farm settings are unavailable.'} tone="error" actionLabel="Retry" onAction={() => void load(true)} /></View>;

  const snapshot = snapshotCoordinates?.latitude === farm.latitude && snapshotCoordinates.longitude === farm.longitude
    ? weather.snapshot
    : null;
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>Local Weather</Text>
          <Text style={styles.subtitle}>{farm.farm_name} · {cacheAge(weather.fetchedAt)}</Text>
        </View>
        {snapshot ? <>
          <View style={styles.currentCard}>
            <View style={styles.currentTop}>
              <View>
                <Text style={styles.currentLabel}>Current conditions</Text>
                <Text style={styles.temperature}>{snapshot.temperature.toFixed(0)}°C</Text>
                <Text style={styles.condition}>{weatherDescription(snapshot.weatherCode)}</Text>
              </View>
              <View style={[styles.statusPill, weather.isFresh ? styles.freshPill : styles.stalePill]} accessibilityLabel={weather.isFresh ? 'Fresh forecast' : 'Stale forecast'}>
                <Text style={[styles.statusText, weather.isFresh ? styles.freshText : styles.staleText]}>{weather.isFresh ? 'Fresh' : 'Stale'}</Text>
              </View>
            </View>
            <View style={styles.metrics}>
              <Metric label="Feels like" value={`${snapshot.apparentTemperature.toFixed(0)}°C`} />
              <Metric label="Precipitation" value={`${snapshot.precipitation.toFixed(1)} mm`} />
              <Metric label="Wind" value={`${snapshot.windSpeed.toFixed(0)} km/h`} />
            </View>
          </View>
          {weather.error ? <View accessibilityRole="alert" style={styles.warning}><Text style={styles.warningTitle}>Showing saved forecast</Text><Text style={styles.warningText}>{weather.error}</Text></View> : null}
          <View style={styles.forecastHeader}><Text accessibilityRole="header" style={styles.forecastTitle}>Three-day forecast</Text><Text style={styles.forecastSubtitle}>Temperature high / low</Text></View>
          <View style={styles.forecastList}>
            {snapshot.days.map((day) => <View key={day.date} style={styles.day}>
              <View style={styles.dayCopy}><Text style={styles.dayDate}>{day.date}</Text><Text style={styles.dayCondition}>{weatherDescription(day.weatherCode)}</Text></View>
              <Text style={styles.dayTemperature}>{day.temperatureMax.toFixed(0)}° / {day.temperatureMin.toFixed(0)}°C</Text>
            </View>)}
          </View>
        </> : loading ? (
          <ScreenState title="Loading weather" message="Checking the farm forecast and saved cache." loading />
        ) : (
          <ScreenState title="No weather saved" message={weather.error ?? 'Connect to the internet to load the first forecast for this farm.'} tone="error" actionLabel="Retry" onAction={() => void load(true)} />
        )}
        <Pressable accessibilityRole="button" accessibilityLabel="Retry weather refresh" accessibilityState={{ disabled: refreshing }} disabled={refreshing} onPress={() => void load(true)} style={[styles.retryButton, refreshing && styles.retryDisabled]}>
          {refreshing ? <ActivityIndicator color={colors.primaryDark} /> : <Text style={styles.retryText}>Retry weather refresh</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  heading: { gap: spacing.xs },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.mutedText, fontSize: 14, lineHeight: 20 },
  currentCard: { padding: spacing.lg, gap: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.primaryDark },
  currentTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  currentLabel: { color: '#DCECD9', fontWeight: '700', fontSize: 14 },
  temperature: { color: colors.surface, fontSize: 48, fontWeight: '800', letterSpacing: -1, marginTop: spacing.xs },
  condition: { color: '#DCECD9', fontSize: 16, marginTop: spacing.xs },
  statusPill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  freshPill: { backgroundColor: '#DCECD9' },
  stalePill: { backgroundColor: '#FFF0C2' },
  statusText: { fontWeight: '800', fontSize: 12 },
  freshText: { color: colors.primaryDark },
  staleText: { color: colors.warning },
  metrics: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#63916C', paddingTop: spacing.md, gap: spacing.sm },
  metric: { flex: 1, gap: spacing.xs },
  metricLabel: { color: '#DCECD9', fontSize: 12 },
  metricValue: { color: colors.surface, fontSize: 14, fontWeight: '700' },
  warning: { backgroundColor: colors.warningSoft, borderRadius: radii.md, borderWidth: 1, borderColor: '#E6C66D', padding: spacing.md, gap: spacing.xs },
  warningTitle: { color: colors.warning, fontWeight: '800' },
  warningText: { color: colors.warning, lineHeight: 20 },
  forecastHeader: { gap: 2 },
  forecastTitle: { color: colors.text, fontSize: 21, fontWeight: '800' },
  forecastSubtitle: { color: colors.mutedText, fontSize: 14 },
  forecastList: { gap: spacing.sm },
  day: { minHeight: 70, padding: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dayCopy: { flex: 1, gap: spacing.xs },
  dayDate: { color: colors.text, fontWeight: '700', fontSize: 16 },
  dayCondition: { color: colors.mutedText, fontSize: 13 },
  dayTemperature: { color: colors.primaryDark, fontWeight: '800' },
  retryButton: { minHeight: 46, borderWidth: 1, borderColor: colors.primary, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  retryDisabled: { opacity: 0.6 },
  retryText: { color: colors.primaryDark, fontWeight: '700' },
});
