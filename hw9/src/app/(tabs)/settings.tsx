import { StyleSheet, View, Text } from "react-native";

import { Colors } from "@/constants/ou-theme";

export default function TabSettings() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Settings</Text>
      <Text style={styles.body}>
        hw9 — Offline SQLite CRUD demo
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
    padding: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.crimson,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
