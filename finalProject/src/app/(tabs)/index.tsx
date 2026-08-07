import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatTile } from '@/components/stat-tile';
import { colors, radii, spacing, typeScale } from '@/constants/theme';
import { useBinder } from '@/context/binder-context';
import { useIdentity } from '@/context/identity-context';

export default function HomeScreen() {
  const { handle } = useIdentity();
  const { haves, wants } = useBinder();
  const haveQuantity = haves.reduce((total, card) => total + card.qty, 0);
  const wantQuantity = wants.reduce((total, card) => total + card.qty, 0);

  function openImport(listKind: 'haves' | 'wants') {
    router.push({ pathname: '/import', params: { listKind } });
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>YOUR COLLECTION, READY TO TRADE</Text>
        <Text style={styles.title}>Hello, @{handle}</Text>
        <Text style={styles.subtitle}>
          Import your binder, compare want lists, and keep a record of every trade.
        </Text>

        <View style={styles.statsRow}>
          <StatTile label="Cards to trade" value={haveQuantity} />
          <StatTile label="Cards wanted" value={wantQuantity} />
        </View>
        <Text style={styles.uniqueCount}>
          {haves.length} unique haves · {wants.length} unique wants
        </Text>

        <Text style={styles.sectionTitle}>Quick actions</Text>
        <Pressable onPress={() => openImport('haves')} style={styles.actionCard}>
          <View style={styles.actionIcon}>
            <Ionicons color={colors.accent} name="albums-outline" size={24} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Import trade binder</Text>
            <Text style={styles.actionDescription}>Paste your cards available for trade.</Text>
          </View>
          <Ionicons color={colors.textMuted} name="chevron-forward" size={20} />
        </Pressable>
        <Pressable onPress={() => openImport('wants')} style={styles.actionCard}>
          <View style={styles.actionIcon}>
            <Ionicons color={colors.accent} name="heart-outline" size={24} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Import want list</Text>
            <Text style={styles.actionDescription}>Add the cards you are looking for.</Text>
          </View>
          <Ionicons color={colors.textMuted} name="chevron-forward" size={20} />
        </Pressable>
        <Pressable onPress={() => router.push('/trade')} style={styles.actionCard}>
          <View style={styles.actionIcon}>
            <Ionicons color={colors.accent} name="swap-horizontal" size={24} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Find a trade</Text>
            <Text style={styles.actionDescription}>Show or scan a trader QR code.</Text>
          </View>
          <Ionicons color={colors.textMuted} name="chevron-forward" size={20} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  actionDescription: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  actionIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    color: colors.text,
    fontSize: typeScale.body,
    fontWeight: '700',
  },
  container: {
    flexGrow: 1,
    gap: spacing.lg,
    padding: spacing.xl,
    paddingBottom: 48,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: typeScale.caption,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: spacing.sm,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typeScale.body,
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typeScale.subtitle,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typeScale.display,
    fontWeight: '800',
  },
  uniqueCount: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: -spacing.sm,
    textAlign: 'center',
  },
});
