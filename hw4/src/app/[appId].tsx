import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { APPS } from '@/constants/apps';
import { Colors } from '@/constants/colors';
import { usePressScale } from '@/hooks/use-press-scale';

const IOS_BLUE = '#007AFF';

export default function AppDetailScreen() {
  const { appId } = useLocalSearchParams<{ appId: string }>();
  const app = APPS.find((a) => a.id === appId);
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.8);

  if (!app) return <Redirect href="/" />;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
        >
          <Animated.View style={[styles.backButton, animatedStyle]}>
            <Ionicons name="chevron-back" size={24} color={IOS_BLUE} />
            <Text style={styles.backLabel}>Home</Text>
          </Animated.View>
        </Pressable>
        <Text style={styles.headerTitle}>{app.label}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.body}>
        <Text style={styles.message}>{app.message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    width: 90,
  },
  backLabel: {
    fontSize: 17,
    color: IOS_BLUE,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.label,
  },
  headerSpacer: {
    width: 90,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 20,
    fontWeight: '500',
    color: Colors.label,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
