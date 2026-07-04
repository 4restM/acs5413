import { FlatList, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import AppCard from '@/components/app-card';
import { APPS } from '@/constants/apps';
import { Colors } from '@/constants/colors';
import type { AppItem } from '@/constants/apps';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Apps</Text>
      <FlatList
        data={APPS}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }: { item: AppItem }) => (
          <AppCard
            app={item}
            onPress={() => router.push(`/${item.id}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.label,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  list: {
    gap: 12,
    padding: 16,
  },
  row: {
    gap: 12,
  },
});
