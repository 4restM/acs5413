import { View, Text, StyleSheet } from 'react-native';
import { Stack, Redirect, useLocalSearchParams } from 'expo-router';
import { APPS } from '@/constants/apps';
import { Colors } from '@/constants/colors';

export default function AppDetailScreen() {
  const { appId } = useLocalSearchParams<{ appId: string }>();
  const app = APPS.find((a) => a.id === appId);

  if (!app) return <Redirect href="/" />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: app.label }} />
      <Text style={styles.message}>{app.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  message: {
    fontSize: 20,
    fontWeight: '500',
    color: Colors.label,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
