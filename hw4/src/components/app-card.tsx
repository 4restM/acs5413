import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { AppItem } from '@/constants/apps';

type Props = {
  app: AppItem;
  onPress: () => void;
};

export default function AppCard({ app, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={app.label}
    >
      {app.iconSet === 'ionicons' ? (
        <Ionicons name={app.iconName as any} size={44} color={app.tint} />
      ) : (
        <MaterialCommunityIcons name={app.iconName as any} size={44} color={app.tint} />
      )}
      <Text style={styles.label}>{app.label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
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
