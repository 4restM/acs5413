import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { colors, spacing, typeScale } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>YOUR COLLECTION, READY TO TRADE</Text>
        <Text style={styles.title}>MTG Trade Binder</Text>
        <Text style={styles.subtitle}>
          Import your binder, compare want lists, and keep a record of every trade.
        </Text>
        <EmptyState
          icon="sparkles"
          message="Your binder counts and trade shortcuts will appear here after setup."
          title="Ready for your first cards"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
    padding: spacing.xl,
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
  title: {
    color: colors.text,
    fontSize: typeScale.display,
    fontWeight: '800',
  },
});
