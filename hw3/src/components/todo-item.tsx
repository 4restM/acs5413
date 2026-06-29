import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/ou-theme';

type Props = {
  text: string;
  onDelete: () => void;
};

// this is a component for the todo items
export default function TodoItem({ text, onDelete }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.text} numberOfLines={2}>{text}</Text>
      {/* touchableOpacity is used for UX, want to have an indication of an action for user */}
      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} accessibilityLabel="Delete task">
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  text: { flex: 1, fontSize: 16, color: Colors.textDark },
  deleteBtn: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.crimson,
    borderRadius: 6,
  },
  deleteText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
});
