import { Link, Stack } from "expo-router";
import { StyleSheet, View, Text } from "react-native";

import { Colors } from "@/constants/ou-theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Oops!",
          headerStyle: { backgroundColor: Colors.crimson },
          headerTintColor: Colors.cream,
        }}
      />
      <View style={styles.container}>
        <Text style={styles.text}>This screen doesn&apos;t exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: Colors.cream,
  },
  text: {
    color: Colors.textDark,
    fontSize: 16,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    color: Colors.crimson,
    fontWeight: "bold",
  },
});
