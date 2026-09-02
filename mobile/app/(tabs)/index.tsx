import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/src/components/screen";
import { useAuth } from "@/src/providers/auth-provider";
import { translate } from "@/src/i18n";
import { usePreferences } from "@/src/providers/preferences-provider";

export default function HomeScreen() {
  const { session } = useAuth();
  const { language } = usePreferences();
  const router = useRouter();

  return (
    <Screen>
      <Text style={styles.eyebrow}>FITTRACK</Text>
      <Text style={styles.title}>{translate(language, "readyToTrain")}</Text>
      <Text style={styles.subtitle}>
        {language === "sk" ? "Váš mobilný tréningový spoločník je pripojený." : "Your mobile workout companion is connected."}
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{translate(language, "signedInAs")}</Text>
        <Text style={styles.email}>{session?.user.email ?? "your account"}</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.push("/workouts")} style={styles.button}>
        <Text style={styles.buttonText}>{translate(language, "viewWorkouts")}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: "#B7F34A",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  title: {
    color: "#F7F8F5",
    fontSize: 36,
    fontWeight: "800",
    marginTop: 10,
  },
  subtitle: { color: "#A0AAA0", fontSize: 16, lineHeight: 24, marginTop: 8 },
  card: { backgroundColor: "#182019", borderColor: "#2B372C", borderRadius: 16, borderWidth: 1, marginTop: 32, padding: 20 },
  cardTitle: { color: "#A0AAA0", fontSize: 14 },
  email: { color: "#F7F8F5", fontSize: 16, fontWeight: "600", marginTop: 6 },
  button: { alignItems: "center", backgroundColor: "#B7F34A", borderRadius: 12, marginTop: 24, padding: 15 },
  buttonText: { color: "#101510", fontSize: 16, fontWeight: "800" },
});
