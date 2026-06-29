import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '@/constants/ou-theme';

type Props = {
  visible: boolean;
  onAdd: (text: string) => void;
  onCancel: () => void;
};

//this is the modal component. It removes white space from input and normalizes the input on cancel.
export default function AddTodoModal({ visible, onAdd, onCancel }: Props) {
  const [text, setText] = useState('');

  function handleAdd() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText('');
  }

  function handleCancel() {
    setText('');
    onCancel();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      {/* used to ensure input remains in focus */}
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>New Task</Text>
          <TextInput
            style={styles.input}
            placeholder="What do you need to do?"
            placeholderTextColor={Colors.textMuted}
            value={text}
            onChangeText={setText}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          {/* similiar to web, we want ux to have action and cancel */}
          <View style={styles.buttons}>
            <TouchableOpacity onPress={handleCancel} style={[styles.btn, styles.cancelBtn]}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAdd} style={[styles.btn, styles.addBtn]}>
              <Text style={styles.addText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  title: { fontSize: 20, fontWeight: '700', color: Colors.crimson, marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.textDark,
    marginBottom: 20,
  },
  buttons: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.border },
  addBtn: { backgroundColor: Colors.crimson },
  cancelText: { fontSize: 16, fontWeight: '600', color: Colors.textDark },
  addText: { fontSize: 16, fontWeight: '600', color: Colors.white },
});
