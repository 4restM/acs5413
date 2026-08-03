import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

const FEATURES = [
  { title: 'Farm Map', description: 'Place and revisit field, equipment, and storage markers.', route: '/map', icon: 'map-outline' },
  { title: 'Inventory', description: 'Track supplies and quantities while offline.', route: '/inventory', icon: 'cube-outline' },
  { title: 'Plant Rotation', description: 'Record crop cycles for each field.', route: '/rotation', icon: 'leaf-outline' },
  { title: 'Money In / Out', description: 'Maintain a simple income and expense ledger.', route: '/money', icon: 'wallet-outline' },
  { title: 'Local Weather', description: 'See current conditions and a three-day forecast.', route: '/weather', icon: 'partly-sunny-outline' },
] as const;

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text accessibilityRole="header" style={styles.title}>Farmstead</Text>
          <Text style={styles.subtitle}>A calm, offline-first home for daily farm operations.</Text>
        </View>
        <View style={styles.list}>
          {FEATURES.map((feature) => (
            <Pressable
              key={feature.route}
              accessibilityRole="button"
              accessibilityLabel={`${feature.title}. ${feature.description}`}
              accessibilityHint={`Opens ${feature.title}`}
              onPress={() => router.push(feature.route)}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
              <View style={styles.iconWrap}>
                <Ionicons name={feature.icon as never} size={28} color={colors.primary} />
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>{feature.title}</Text>
                <Text style={styles.cardDescription}>{feature.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={colors.mutedText} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl },
  hero: { gap: spacing.sm, paddingTop: spacing.md },
  title: { color: colors.primaryDark, fontSize: 34, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { color: colors.mutedText, fontSize: 17, lineHeight: 24, maxWidth: 330 },
  list: { gap: spacing.md },
  card: { minHeight: 100, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border },
  cardPressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  iconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  cardCopy: { flex: 1, gap: spacing.xs },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  cardDescription: { color: colors.mutedText, fontSize: 14, lineHeight: 19 },
});
