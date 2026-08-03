import { router, Stack, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/ou-theme";

export default function ItemModal() {
  const { id } = useLocalSearchParams();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editMode, setEditMode] = useState(false);

  const database = useSQLiteContext();

  React.useEffect(() => {
    if (id) {
      setEditMode(true);
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    const result = await database.getFirstAsync<{
      id: number;
      name: string;
      email: string;
    }>(`SELECT * FROM users WHERE id = ?`, [parseInt(id as string)]);
    setName(result?.name ?? "");
    setEmail(result?.email ?? "");
  };

  const handleSave = async () => {
    try {
      await database.runAsync(
        `INSERT INTO users (name, email, image) VALUES (?, ?, ?)`,
        [name, email, ""]
      );
      router.back();
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  const handleUpdate = async () => {
    try {
      await database.runAsync(
        `UPDATE users SET name = ?, email = ? WHERE id = ?`,
        [name, email, parseInt(id as string)]
      );
      router.back();
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: editMode ? "Edit User" : "Add User",
          headerStyle: { backgroundColor: Colors.crimson },
          headerTintColor: Colors.cream,
        }}
      />
      <View style={styles.form}>
        <TextInput
          placeholder="Name"
          placeholderTextColor={Colors.textMuted}
          value={name}
          onChangeText={(text) => setName(text)}
          style={styles.textInput}
        />
        <TextInput
          placeholder="Email"
          placeholderTextColor={Colors.textMuted}
          value={email}
          keyboardType="email-address"
          onChangeText={(text) => setEmail(text)}
          style={styles.textInput}
        />
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.button, styles.cancelButton]}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => (editMode ? handleUpdate() : handleSave())}
          style={[styles.button, styles.saveButton]}
        >
          <Text style={styles.saveButtonText}>
            {editMode ? "Update" : "Save"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Colors.cream,
  },
  form: {
    gap: 20,
    marginVertical: 20,
    width: "100%",
    paddingHorizontal: 20,
  },
  textInput: {
    borderWidth: 1,
    padding: 10,
    width: "100%",
    borderRadius: 5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    color: Colors.textDark,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 20,
  },
  button: {
    height: 40,
    width: 100,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.crimson,
  },
  cancelButtonText: {
    fontWeight: "bold",
    color: Colors.crimson,
  },
  saveButton: {
    backgroundColor: Colors.crimson,
  },
  saveButtonText: {
    fontWeight: "bold",
    color: Colors.cream,
  },
});
