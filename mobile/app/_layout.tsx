import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AuthProvider, useAuth } from "@/src/providers/auth-provider";
import { PreferencesProvider, usePreferences } from "@/src/providers/preferences-provider";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </PreferencesProvider>
  );
}

function RootNavigator() {
  const { isLoading, session } = useAuth();
  const { isLoading: preferencesLoading, theme } = usePreferences();

  if (isLoading || preferencesLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#B7F34A" />
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={Boolean(session)}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="workout/new" />
          <Stack.Screen name="workout/[id]" />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    backgroundColor: "#101510",
    flex: 1,
    justifyContent: "center",
  },
});
