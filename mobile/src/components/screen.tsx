import type { PropsWithChildren } from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";

import { usePreferences } from "@/src/providers/preferences-provider";

export function Screen({ children }: PropsWithChildren) {
  const { theme } = usePreferences();
  const backgroundColor = theme === "dark" ? "#101510" : "#F7F8F5";

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: "#101510", flex: 1 },
  content: { flexGrow: 1, padding: 24 },
});
