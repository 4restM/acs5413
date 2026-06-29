import { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/ou-theme';

type Todo = { id: string; text: string };

export default function HomeScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);

  function deleteTodo(id: string) {
    setTodos(prev => prev.filter(t => t.id !== id));
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/OU.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>OU To-Do</Text>
      </View>


      {/* List w/ empty case */}
      <FlatList
        data={todos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.itemText}>{item.text}</Text>
            <TouchableOpacity onPress={() => deleteTodo(item.id)} style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={todos.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No tasks yet.</Text>
            <Text style={styles.emptySubtext}>Tap the button below to add one.</Text>
          </View>
        }
      />

      {/* create placeholder */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.addButton} onPress={() => {}}>
          <Text style={styles.addButtonText}>＋ Add Task</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.crimson,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logo: { width: 40, height: 40, marginRight: 12 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.white },
  listContent: { paddingVertical: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.textMuted },
  emptySubtext: { marginTop: 6, fontSize: 14, color: Colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  itemText: { flex: 1, fontSize: 16, color: Colors.textDark },
  deleteBtn: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.crimson,
    borderRadius: 6,
  },
  deleteBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  footer: { padding: 16 },
  addButton: {
    backgroundColor: Colors.crimson,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
});
