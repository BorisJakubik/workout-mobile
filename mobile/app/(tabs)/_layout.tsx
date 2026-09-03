import { Tabs } from "expo-router";
import React from "react";

import { Ionicons } from "@expo/vector-icons";
import { usePreferences } from "@/src/providers/preferences-provider";
import { translate } from "@/src/i18n";

export default function TabLayout() {
  const { language, theme } = usePreferences();
  const isDark = theme === "dark";
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: isDark ? "#101510" : "#F7F8F5" },
        headerTintColor: isDark ? "#F7F8F5" : "#182019",
        sceneStyle: { backgroundColor: isDark ? "#101510" : "#F7F8F5" },
        tabBarActiveTintColor: "#B7F34A",
        tabBarInactiveTintColor: isDark ? "#A0AAA0" : "#6A746A",
        tabBarStyle: { backgroundColor: isDark ? "#182019" : "#FFFFFF", borderTopColor: isDark ? "#2B372C" : "#DDE3DD" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: translate(language, "home"),
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="home-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: translate(language, "workouts"),
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="barbell-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: language === "sk" ? "Pokrok" : "Progress",
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="trending-up-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: translate(language, "settings"),
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="settings-outline" size={size} />,
        }}
      />
    </Tabs>
  );
}
