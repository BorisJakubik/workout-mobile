import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Screen } from "@/src/components/screen";
import { useAuth } from "@/src/providers/auth-provider";
import { usePreferences } from "@/src/providers/preferences-provider";
import { translate } from "@/src/i18n";
import { getProfile, saveProfile } from "@/src/services/profiles";

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const { language, setLanguage, setTheme, setWeightUnit, theme, weightUnit } = usePreferences();
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState("");
  const [surname, setSurname] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!session) return;
      try {
        const profile = await getProfile(session.user.id);
        setName(profile.name);
        setPhoto(profile.photo);
        setSurname(profile.surname);
      } catch (error) {
        Alert.alert("Could not load profile", error instanceof Error ? error.message : "Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadProfile();
  }, [session]);

  const handleSaveProfile = async () => {
    if (!session || !name.trim()) {
      Alert.alert("Name required", "Enter your name before saving.");
      return;
    }
    setIsSaving(true);
    try {
      await saveProfile(session.user.id, { name, photo, surname });
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (error) {
      Alert.alert("Could not save profile", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert("Could not sign out", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const choosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]?.base64) return;
    setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
  };

  const isDark = theme === "dark";
  const colors = isDark
    ? { background: "#101510", border: "#2B372C", card: "#182019", muted: "#A0AAA0", text: "#F7F8F5" }
    : { background: "#F7F8F5", border: "#DDE3DD", card: "#FFFFFF", muted: "#667066", text: "#182019" };
  const initials = `${name.trim()[0] ?? ""}${surname.trim()[0] ?? ""}`.toUpperCase() || "U";

  return (
    <Screen>
      <Text style={[styles.title, { color: colors.text }]}>{translate(language, "settings")}</Text>
      {isLoading ? (
        <ActivityIndicator color="#B7F34A" style={styles.loader} />
      ) : (
        <>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{translate(language, "language")}</Text>
            <View style={styles.optionRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => void setLanguage("sk")}
                style={[styles.option, { borderColor: colors.border }, language === "sk" && styles.selectedOption]}
              >
                <Text style={[styles.optionTitle, { color: colors.text }]}>SK</Text>
                <Text style={[styles.optionText, { color: colors.muted }]}>{translate(language, "slovak")}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => void setLanguage("en")}
                style={[styles.option, { borderColor: colors.border }, language === "en" && styles.selectedOption]}
              >
                <Text style={[styles.optionTitle, { color: colors.text }]}>EN</Text>
                <Text style={[styles.optionText, { color: colors.muted }]}>{translate(language, "english")}</Text>
              </Pressable>
            </View>
          </View>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{translate(language, "appearance")}</Text>
            <View style={styles.optionRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => void setTheme("dark")}
                style={[styles.option, { borderColor: colors.border }, theme === "dark" && styles.selectedOption]}
              >
                <Text style={[styles.optionTitle, { color: colors.text }]}>{translate(language, "darkMode")}</Text>
                <Text style={[styles.optionText, { color: colors.muted }]}>{translate(language, "easyOnEyes")}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => void setTheme("light")}
                style={[styles.option, { borderColor: colors.border }, theme === "light" && styles.selectedOption]}
              >
                <Text style={[styles.optionTitle, { color: colors.text }]}>{translate(language, "lightMode")}</Text>
                <Text style={[styles.optionText, { color: colors.muted }]}>{language === "sk" ? "Svetlé a čisté" : "Bright and clean"}</Text>
              </Pressable>
            </View>
          </View>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{translate(language, "weightUnit")}</Text>
            <View style={styles.optionRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => void setWeightUnit("kg")}
                style={[styles.option, { borderColor: colors.border }, weightUnit === "kg" && styles.selectedOption]}
              >
                <Text style={[styles.optionTitle, { color: colors.text }]}>kg</Text>
                <Text style={[styles.optionText, { color: colors.muted }]}>{translate(language, "kilograms")}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => void setWeightUnit("lbs")}
                style={[styles.option, { borderColor: colors.border }, weightUnit === "lbs" && styles.selectedOption]}
              >
                <Text style={[styles.optionTitle, { color: colors.text }]}>lb</Text>
                <Text style={[styles.optionText, { color: colors.muted }]}>{translate(language, "pounds")}</Text>
              </Pressable>
            </View>
          </View>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{translate(language, "profile")}</Text>
            <View style={styles.photoRow}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.initials]}>
                  <Text style={styles.initialsText}>{initials}</Text>
                </View>
              )}
              <View style={styles.photoActions}>
                <Pressable accessibilityRole="button" onPress={() => void choosePhoto()}>
                  <Text style={styles.photoActionText}>{translate(language, "choosePhoto")}</Text>
                </Pressable>
                {photo ? (
                  <Pressable accessibilityRole="button" onPress={() => setPhoto("")}>
                    <Text style={styles.removeText}>{translate(language, "useInitials")}</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
            <Text style={[styles.label, { color: colors.muted }]}>{translate(language, "name")}</Text>
            <TextInput
              onChangeText={setName}
              placeholder={translate(language, "yourName")}
              placeholderTextColor={colors.muted}
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={name}
            />
            <Text style={[styles.label, { color: colors.muted }]}>{translate(language, "surname")}</Text>
            <TextInput
              onChangeText={setSurname}
              placeholder={translate(language, "yourSurname")}
              placeholderTextColor={colors.muted}
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={surname}
            />
            <Text style={[styles.email, { color: colors.muted }]}>{session?.user.email}</Text>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={() => void handleSaveProfile()}
              style={[styles.saveButton, isSaving && styles.disabled]}
            >
              {isSaving ? <ActivityIndicator color="#101510" /> : <Text style={styles.saveText}>{translate(language, "saveProfile")}</Text>}
            </Pressable>
          </View>
        </>
      )}
      <Pressable accessibilityRole="button" onPress={handleSignOut} style={styles.button}>
        <Text style={styles.buttonText}>{translate(language, "signOut")}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: "#F7F8F5", fontSize: 32, fontWeight: "800" },
  loader: { marginTop: 36 },
  card: { borderRadius: 14, borderWidth: 1, marginTop: 18, padding: 16 },
  cardTitle: { fontSize: 19, fontWeight: "700" },
  optionRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  option: { borderRadius: 10, borderWidth: 1, flex: 1, padding: 12 },
  selectedOption: { borderColor: "#B7F34A", borderWidth: 2 },
  optionTitle: { fontSize: 15, fontWeight: "700" },
  optionText: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  photoRow: { alignItems: "center", flexDirection: "row", gap: 14, marginTop: 16 },
  avatar: { borderRadius: 30, height: 60, width: 60 },
  initials: { alignItems: "center", backgroundColor: "#B7F34A", justifyContent: "center" },
  initialsText: { color: "#101510", fontSize: 20, fontWeight: "800" },
  photoActions: { gap: 10 },
  photoActionText: { color: "#B7F34A", fontSize: 14, fontWeight: "700" },
  removeText: { color: "#C97B70", fontSize: 14, fontWeight: "700" },
  label: { fontSize: 13, marginBottom: 6, marginTop: 16 },
  input: { borderRadius: 9, borderWidth: 1, fontSize: 16, padding: 12 },
  email: { fontSize: 13, marginTop: 16 },
  saveButton: { alignItems: "center", backgroundColor: "#B7F34A", borderRadius: 10, justifyContent: "center", marginTop: 20, minHeight: 48 },
  saveText: { color: "#101510", fontSize: 15, fontWeight: "800" },
  button: { borderColor: "#B7F34A", borderRadius: 12, borderWidth: 1, marginTop: 28, padding: 14 },
  buttonText: { color: "#B7F34A", fontSize: 16, fontWeight: "700", textAlign: "center" },
  disabled: { opacity: 0.65 },
});
