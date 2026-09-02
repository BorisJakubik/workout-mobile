import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/src/components/screen";
import { WorkoutCalendar } from "@/src/components/workout-calendar";
import { formatWorkoutDate, getWorkouts } from "@/src/services/workouts";
import type { Workout } from "@/src/types";
import { translate, translateWorkoutName } from "@/src/i18n";
import { usePreferences } from "@/src/providers/preferences-provider";

export default function WorkoutsScreen() {
  const router = useRouter();
  const { language } = usePreferences();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleWorkoutsCount, setVisibleWorkoutsCount] = useState(5);

  const loadWorkouts = useCallback(async () => {
    setIsLoading(true);
    try {
      setWorkouts(await getWorkouts());
    } catch (error) {
      Alert.alert("Could not load workouts", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkouts();
  }, [loadWorkouts]);

  const visibleWorkouts = workouts.slice(0, visibleWorkoutsCount);

  return (
    <Screen>
      <Text style={styles.title}>{translate(language, "workouts")}</Text>
      <Text style={styles.description}>
        {language === "sk" ? "Otvorte tréning a zaznamenajte svoje výsledky." : "Open a workout to record and save your results."}
      </Text>
      <Pressable accessibilityRole="button" onPress={() => router.push("/workout/new")} style={styles.newButton}>
        <Text style={styles.newButtonText}>+ {translate(language, "newWorkout")}</Text>
      </Pressable>
      {!isLoading && <WorkoutCalendar onSelectWorkout={(workout) => router.push(`/workout/${workout.id}`)} workouts={workouts} />}
      <Pressable accessibilityRole="button" onPress={() => void loadWorkouts()} style={styles.refreshButton}>
        <Text style={styles.refreshText}>{translate(language, "refresh")}</Text>
      </Pressable>
      {isLoading ? (
        <ActivityIndicator color="#B7F34A" style={styles.loader} />
      ) : workouts.length ? (
        <View style={styles.list}>
          {visibleWorkouts.map((workout) => (
            <Pressable key={workout.id} onPress={() => router.push(`/workout/${workout.id}`)} style={styles.workoutCard}>
              <Text style={styles.workoutName}>{translateWorkoutName(workout.name, language)}</Text>
              <Text style={styles.workoutMeta}>
                {formatWorkoutDate(workout.date, language)} · {workout.duration} min · {workout.exercises.length} {translate(language, "exercises")}
              </Text>
            </Pressable>
          ))}
          {visibleWorkoutsCount < workouts.length ? (
            <Pressable accessibilityRole="button" onPress={() => setVisibleWorkoutsCount((count) => count + 5)} style={styles.showMoreButton}>
              <Text style={styles.showMoreText}>{language === "sk" ? "Zobraziť viac" : "Show more"}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{translate(language, "noWorkouts")}</Text>
          <Text style={styles.emptyText}>
            {language === "sk" ? "Dokončené tréningy z FitTracku sa zobrazia tu." : "Completed workouts from FitTrack will appear here."}
          </Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: "#F7F8F5", fontSize: 32, fontWeight: "800" },
  description: { color: "#A0AAA0", fontSize: 16, lineHeight: 24, marginTop: 12 },
  newButton: { alignItems: "center", backgroundColor: "#B7F34A", borderRadius: 12, marginTop: 18, padding: 14 },
  newButtonText: { color: "#101510", fontSize: 16, fontWeight: "800" },
  refreshButton: { alignSelf: "flex-start", marginTop: 18, paddingVertical: 8 },
  refreshText: { color: "#B7F34A", fontSize: 15, fontWeight: "700" },
  loader: { marginTop: 44 },
  list: { gap: 12, marginTop: 20 },
  workoutCard: { backgroundColor: "#182019", borderColor: "#2B372C", borderRadius: 14, borderWidth: 1, padding: 16 },
  workoutName: { color: "#F7F8F5", fontSize: 18, fontWeight: "700" },
  workoutMeta: { color: "#A0AAA0", fontSize: 14, lineHeight: 20, marginTop: 7 },
  emptyCard: { backgroundColor: "#182019", borderColor: "#2B372C", borderRadius: 14, borderWidth: 1, marginTop: 22, padding: 18 },
  emptyTitle: { color: "#F7F8F5", fontSize: 18, fontWeight: "700" },
  emptyText: { color: "#A0AAA0", fontSize: 14, lineHeight: 20, marginTop: 6 },
  showMoreButton: { alignItems: "center", borderColor: "#B7F34A", borderRadius: 12, borderWidth: 1, marginTop: 6, padding: 14 },
  showMoreText: { color: "#B7F34A", fontSize: 15, fontWeight: "700" },
});
