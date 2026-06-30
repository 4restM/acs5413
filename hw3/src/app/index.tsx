import { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddTodoModal from '@/components/add-todo-modal';
import TodoItem from '@/components/todo-item';
import { Colors } from '@/constants/ou-theme';

// typed number bc metro local asset ref
const ouLogo = require('../../assets/images/OU.png') as number;

type Todo = { id: string; text: string };

export default function HomeScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  function addTodo(text: string) {
    // date.now used for unique id
    setTodos(prev => [...prev, { id: Date.now().toString(), text }]);
    setModalVisible(false);
  }

  function deleteTodo(id: string) {
    setTodos(prev => prev.filter(t => t.id !== id));
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={ouLogo}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.headerTitle}>ToDos!</Text>
      </View>


      {/* List w/ empty case */}
      <FlatList
        data={todos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TodoItem text={item.text} onDelete={() => deleteTodo(item.id)} />
        )}
        contentContainerStyle={todos.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No tasks yet.</Text>
            <Text style={styles.emptySubtext}>Tap the button below to add one.</Text>
          </View>
        }
      />

      <View style={styles.footer}>
        {/* TouchableOpacity UX component of react native*/}
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>＋ Add Task</Text>
        </TouchableOpacity>
      </View>

        {/* Modal w/ conditional trigger */}
      <AddTodoModal
        visible={modalVisible}
        onAdd={addTodo}
        onCancel={() => setModalVisible(false)}
      />
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
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logo: { width: 36, height: 36 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.white },
  listContent: { paddingVertical: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.textMuted },
  emptySubtext: { marginTop: 6, fontSize: 14, color: Colors.textMuted },
  footer: { padding: 16 },
  addButton: {
    backgroundColor: Colors.crimson,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
});
