import { router, Stack, useFocusEffect } from "expo-router";
import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useSQLiteContext } from "expo-sqlite";

import { Colors } from "@/constants/ou-theme";

type User = { id: number; name: string; email: string };

export default function TabHome() {
  const [data, setData] = React.useState<User[]>([]);
  const database = useSQLiteContext();

  useFocusEffect(
    useCallback(() => {
      loadData(); // Fetch data when the screen is focused
    }, [])
  );

  // Read
  const loadData = async () => {
    const result = await database.getAllAsync<User>("SELECT * FROM users");
    setData(result);
  };
 // Delete
  const handleDelete = (item: User) => {
    Alert.alert(
      "Delete User",
      `Are you sure you want to delete ${item.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await database.runAsync("DELETE FROM users WHERE id = ?", [
                item.id,
              ]);
              loadData();
            } catch (error) {
              console.error("Error deleting item:", error);
            }
          },
        },
      ]
    );
  };

  const headerRight = () => (
    <TouchableOpacity
      onPress={() => router.push("/modal")}
      style={{ marginRight: 10 }}
    >
      <FontAwesome name="plus-circle" size={28} color={Colors.cream} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerRight }} />
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={
          data.length === 0 ? styles.emptyContainer : undefined
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No users yet. Tap + to add one.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email}>{item.email}</Text>
            </View>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                onPress={() => router.push(`/modal?id=${item.id}`)}
                style={[styles.button, styles.editButton]}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                style={[styles.button, styles.deleteButton]}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    marginHorizontal: 12,
    marginTop: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowText: {
    flexShrink: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.textDark,
  },
  email: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    height: 32,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: Colors.crimson,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.cream,
  },
  deleteButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.crimson,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.crimson,
  },
});
