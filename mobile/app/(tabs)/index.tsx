import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import { Screen } from "@/src/components/screen";
import { translate, translateWorkoutName } from "@/src/i18n";
import { getCatalog, type CatalogCategory, type CatalogExercise } from "@/src/services/catalog";
import { getProfile } from "@/src/services/profiles";
import { formatWorkoutDate, getWorkouts } from "@/src/services/workouts";
import type { Workout } from "@/src/types";
import { useAuth } from "@/src/providers/auth-provider";
import { usePreferences } from "@/src/providers/preferences-provider";

const formatMinutes = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

export default function HomeScreen() {
  const { session } = useAuth();
  const { language, weightUnit } = usePreferences();
  const router = useRouter();
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [exercises, setExercises] = useState<CatalogExercise[]>([]);
  const [name, setName] = useState("");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const [catalog, profile, loadedWorkouts] = await Promise.all([getCatalog(), getProfile(session.user.id), getWorkouts()]);
      setCategories(catalog.categories);
      setExercises(catalog.exercises);
      setName(profile.name);
      setWorkouts(loadedWorkouts);
    } catch (error) {
      Alert.alert(
        language === "sk" ? "Dashboard sa nepodarilo načítať" : "Could not load dashboard",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [language, session]);
  useFocusEffect(useCallback(() => void load(), [load]));

  const stats = useMemo(() => {
    const totalMinutes = workouts.reduce((total, workout) => total + workout.duration, 0);
    const best = workouts
      .flatMap((workout) => workout.exercises.flatMap((exercise) => exercise.sets.map((set) => set.weight)))
      .reduce((max, weight) => Math.max(max, weight), 0);
    return { best, totalMinutes };
  }, [workouts]);
  const bestWeight = weightUnit === "lbs" ? Math.round(stats.best * 2.20462 * 10) / 10 : stats.best;
  const firstName = name.split(/\s+/)[0] || session?.user.email?.split("@")[0] || "";

  return (
    <Screen>
      {isLoading ? (
        <ActivityIndicator color="#B7F34A" style={styles.loader} />
      ) : (
        <>
          <Text style={styles.eyebrow}>{language === "sk" ? "DNES" : "TODAY"}</Text>
          <Text style={styles.title}>
            {language === "sk" ? "Poďme trénovať," : "Let's train,"}
            {"\n"}
            <Text style={styles.accent}>{firstName}.</Text>
          </Text>
          <Text style={styles.subtitle}>{language === "sk" ? "Každá séria sa počíta." : "Every set counts."}</Text>
          <View style={styles.stats}>
            <Stat icon="barbell-outline" label={translate(language, "workouts")} value={String(workouts.length)} />
            <Stat icon="time-outline" label={language === "sk" ? "Celkový čas" : "Total time"} value={formatMinutes(stats.totalMinutes)} />
            <Stat icon="trophy-outline" label={language === "sk" ? "Najvyššia váha" : "Highest weight"} value={`${bestWeight} ${weightUnit}`} />
          </View>
          <Heading
            eyebrow={language === "sk" ? "DNEŠNÝ TRÉNING" : "TODAY'S WORKOUT"}
            title={language === "sk" ? "Vyberte typ tréningu" : "Choose a workout"}
          />
          {categories.map((category, index) => (
            <Pressable
              key={category.id}
              onPress={() => router.push({ pathname: "/workout/new", params: { categoryId: category.id } })}
              style={styles.typeCard}
            >
              <Text style={styles.typeNumber}>{String(index + 1).padStart(2, "0")}</Text>
              <Ionicons color="#B7F34A" name="barbell-outline" size={24} />
              <View style={styles.typeText}>
                <Text style={styles.typeName}>{translateWorkoutName(category.name, language)}</Text>
                <Text style={styles.meta}>
                  {exercises.filter((item) => item.categoryId === category.id).length} {translate(language, "exercises")}
                </Text>
              </View>
              <Ionicons color="#B7F34A" name="add" size={22} />
            </Pressable>
          ))}
          <View style={styles.recentHeading}>
            <Heading eyebrow={language === "sk" ? "NEDÁVNE" : "RECENT"} title={language === "sk" ? "Posledné tréningy" : "Recent workouts"} />
            <Pressable onPress={() => router.push("/workouts")}>
              <Text style={styles.link}>{language === "sk" ? "Zobraziť všetko" : "Show all"}</Text>
            </Pressable>
          </View>
          {workouts.slice(0, 2).map((workout) => (
            <Pressable key={workout.id} onPress={() => router.push(`/workout/${workout.id}`)} style={styles.workoutCard}>
              <Text style={styles.typeName}>{translateWorkoutName(workout.name, language)}</Text>
              <Text style={styles.meta}>
                {formatWorkoutDate(workout.date, language)} · {workout.duration} min · {workout.exercises.length} {translate(language, "exercises")}
              </Text>
            </Pressable>
          ))}
          {!workouts.length && <Text style={styles.meta}>{translate(language, "noWorkouts")}</Text>}
        </>
      )}
    </Screen>
  );
}

function Heading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={styles.heading}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}
function Stat({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons color="#B7F34A" name={icon} size={22} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.meta}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 64 },
  eyebrow: { color: "#B7F34A", fontSize: 12, fontWeight: "700", letterSpacing: 1.2 },
  title: { color: "#F7F8F5", fontSize: 34, fontWeight: "800", marginTop: 8 },
  accent: { color: "#B7F34A" },
  subtitle: { color: "#A0AAA0", fontSize: 16, marginTop: 8 },
  stats: { flexDirection: "row", gap: 10, marginTop: 26 },
  stat: { backgroundColor: "#182019", borderColor: "#2B372C", borderRadius: 14, borderWidth: 1, flex: 1, padding: 12 },
  statValue: { color: "#F7F8F5", fontSize: 19, fontWeight: "800", marginTop: 10 },
  meta: { color: "#A0AAA0", fontSize: 12, marginTop: 4 },
  heading: { marginTop: 32 },
  sectionTitle: { color: "#F7F8F5", fontSize: 21, fontWeight: "800", marginTop: 4 },
  typeCard: {
    alignItems: "center",
    backgroundColor: "#182019",
    borderColor: "#2B372C",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    padding: 14,
  },
  typeNumber: { color: "#778177", fontSize: 12, fontWeight: "800" },
  typeText: { flex: 1 },
  typeName: { color: "#F7F8F5", fontSize: 16, fontWeight: "700" },
  recentHeading: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between" },
  link: { color: "#B7F34A", fontSize: 14, fontWeight: "700" },
  workoutCard: { backgroundColor: "#182019", borderColor: "#2B372C", borderRadius: 14, borderWidth: 1, marginTop: 12, padding: 15 },
});
