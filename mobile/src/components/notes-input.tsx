import { useEffect, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePreferences } from "@/src/providers/preferences-provider";
import { translate } from "@/src/i18n";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onActiveChange: (active: boolean) => void;
  disabled?: boolean;
};

export function NotesInput({ value, onChange, onActiveChange, disabled }: Props) {
  const { language } = usePreferences();
  const sk = language === "sk";
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  const session = useRef(false);
  const mounted = useRef(true);
  const base = useRef("");
  const moduleRef = useRef<typeof import("expo-speech-recognition").ExpoSpeechRecognitionModule | null>(null);
  const subscriptions = useRef<{ remove: () => void }[]>([]);
  const callbacks = useRef({ onChange, onActiveChange });
  useEffect(() => { callbacks.current = { onChange, onActiveChange }; }, [onChange, onActiveChange]);

  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" && session.current) moduleRef.current?.stop();
    });
    return () => {
      mounted.current = false;
      subscription.remove();
      subscriptions.current.forEach((item) => item.remove());
      if (session.current) moduleRef.current?.abort();
      session.current = false;
      callbacks.current.onActiveChange(false);
    };
  }, []);

  const toggle = async () => {
    if (session.current) {
      moduleRef.current?.stop();
      return;
    }
    session.current = true;
    setActive(true);
    onActiveChange(true);
    setError("");
    const finish = () => {
      session.current = false;
      if (!mounted.current) return;
      setActive(false);
      callbacks.current.onActiveChange(false);
    };
    try {
      const { ExpoSpeechRecognitionModule: recognition } = await import("expo-speech-recognition");
      if (!mounted.current) return;
      moduleRef.current = recognition;
      if (!recognition.isRecognitionAvailable()) throw new Error("unavailable");
      const permission = await recognition.requestPermissionsAsync();
      if (!mounted.current) return;
      if (!permission.granted) {
        setError(sk ? "Povoľte mikrofón a rozpoznávanie reči v nastaveniach aplikácie." : "Allow microphone and speech recognition in app settings.");
        finish();
        return;
      }
      subscriptions.current.forEach((item) => item.remove());
      base.current = value.trimEnd();
      subscriptions.current = [
        recognition.addListener("result", (event) => {
          if (!session.current || !mounted.current) return;
          const transcript = event.results[0]?.transcript.trim();
          if (!transcript) return;
          const next = [base.current, transcript].filter(Boolean).join(" ");
          callbacks.current.onChange(next);
          if (event.isFinal) base.current = next;
        }),
        recognition.addListener("end", finish),
        recognition.addListener("error", (event) => {
          if (mounted.current && event.error !== "aborted") {
            setError(sk ? "Reč sa nepodarilo rozpoznať. Skúste diktovanie znova alebo text dopíšte." : "Speech could not be recognized. Try again or type your notes.");
          }
        }),
      ];
      recognition.start({ lang: sk ? "sk-SK" : "en-US", interimResults: true, continuous: true });
    } catch {
      if (mounted.current) setError(sk
        ? "Diktovanie nie je dostupné v tomto zostavení. Použite mikrofón systémovej klávesnice alebo natívny build aplikácie."
        : "Dictation is unavailable in this build. Use your keyboard microphone or a native app build.");
      finish();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{translate(language, "notes")} · {translate(language, "optional")}</Text>
      <TextInput
        accessibilityLabel={translate(language, "notes")}
        editable={!disabled && !active}
        multiline
        onChangeText={onChange}
        placeholder={sk ? "Ako sa ti trénovalo? Technika, energia, poznámky na nabudúce…" : "How did it go? Technique, energy, notes for next time…"}
        placeholderTextColor="#778177"
        style={styles.input}
        textAlignVertical="top"
        value={value}
      />
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled, selected: active }} disabled={disabled} onPress={() => void toggle()} style={styles.button}>
        <Ionicons name={active ? "stop-circle" : "mic-outline"} size={22} color="#B7F34A" />
        <Text style={styles.buttonText}>{active ? (sk ? "Zastaviť diktovanie" : "Stop dictation") : (sk ? "Nadiktovať poznámky" : "Dictate notes")}</Text>
      </Pressable>
      {active && <Text accessibilityLiveRegion="polite" style={styles.hint}>{sk ? "Počúvam… Pred uložením zastavte diktovanie." : "Listening… Stop dictation before saving."}</Text>}
      {!!error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 18 },
  label: { color: "#A0AAA0", fontSize: 12, fontWeight: "700", marginBottom: 6 },
  input: { backgroundColor: "#182019", borderColor: "#405043", borderRadius: 8, borderWidth: 1, color: "#F7F8F5", fontSize: 16, minHeight: 120, padding: 12 },
  button: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 48, alignSelf: "flex-start" },
  buttonText: { color: "#B7F34A", fontWeight: "700" },
  hint: { color: "#A0AAA0", fontSize: 13 },
  error: { color: "#FF9D96", fontSize: 13 },
});
