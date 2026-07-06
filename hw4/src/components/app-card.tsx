import { Pressable, Animated, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { usePressScale } from '@/hooks/use-press-scale';
import type { AppItem } from '@/constants/apps';

type Props = {
  app: AppItem;
  onPress: () => void;
};

export default function AppCard({ app, onPress }: Props) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();

  return (
    <Pressable
      style={styles.pressable}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={app.label}
    >
      <Animated.View style={[styles.card, animatedStyle]}>
        {app.iconSet === 'ionicons' ? (
          <Ionicons name={app.iconName as any} size={68} color={app.tint} />
        ) : (
          <MaterialCommunityIcons name={app.iconName as any} size={68} color={app.tint} />
        )}
        <Text style={styles.label}>{app.label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    aspectRatio: 1,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.label,
  },
});
