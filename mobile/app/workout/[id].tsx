import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { formatWorkoutDate, getWorkoutById, updateWorkout } from "@/src/services/workouts";
import type { Workout } from "@/src/types";
import { usePreferences } from "@/src/providers/preferences-provider";
import { translate, translateExerciseName, translateWorkoutName } from "@/src/i18n";

const toNumber = (value: string) => Number(value.replace(",", "."));
const poundsPerKilogram = 2.20462;

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language, weightUnit } = usePreferences();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [collapsedExercises, setCollapsedExercises] = useState<Record<string, boolean>>({});
  const [dateInput, setDateInput] = useState("");

  useEffect(() => {
    const loadWorkout = async () => {
      try {
        const loadedWorkout = await getWorkoutById(id);
        setWorkout(loadedWorkout);
        setDateInput(loadedWorkout?.date.slice(0, 10) ?? "");
      } catch (error) {
        Alert.alert("Could not load workout", error instanceof Error ? error.message : "Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadWorkout();
  }, [id]);

  const updateSet = (exerciseIndex: number, setIndex: number, field: "reps" | "weight", value: string) => {
    const enteredNumber = toNumber(value);
    const number = field === "weight" && weightUnit === "lbs" ? enteredNumber / poundsPerKilogram : enteredNumber;
    if (!Number.isFinite(number) || number < 0) return;
    setWorkout((current) => {
      if (!current) return current;
      const exercises = current.exercises.map((exercise, currentExerciseIndex) => {
        if (currentExerciseIndex !== exerciseIndex) return exercise;
        return { ...exercise, sets: exercise.sets.map((set, currentSetIndex) => (currentSetIndex === setIndex ? { ...set, [field]: number } : set)) };
      });
      return { ...current, exercises };
    });
  };

  const save = async () => {
    if (!workout) return;
    setIsSaving(true);
    try {
      const savedWorkout = await updateWorkout(workout);
      setWorkout(savedWorkout);
      Alert.alert("Saved", "Workout results have been saved.");
    } catch (error) {
      Alert.alert("Could not save workout", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateGeneral = (updates: Partial<Workout>) => setWorkout((current) => (current ? { ...current, ...updates } : current));

  const updateOptionalNumber = (field: "bodyFatPercentage" | "bodyWeight", value: string) => {
    if (!value) {
      updateGeneral({ [field]: null });
      return;
    }
    const number = toNumber(value);
    if (!Number.isFinite(number) || number < 0) return;
    const normalizedNumber = field === "bodyFatPercentage" ? Math.min(100, number) : number;
    updateGeneral({ [field]: field === "bodyWeight" && weightUnit === "lbs" ? normalizedNumber / poundsPerKilogram : normalizedNumber });
  };

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Stack.Screen
        options={{
          headerBackTitle: translate(language, "workouts"),
          headerShown: true,
          headerStyle: { backgroundColor: "#101510" },
          headerTintColor: "#F7F8F5",
          title: translate(language, "workout"),
        }}
      />
      {isLoading ? (
        <ActivityIndicator color="#B7F34A" style={styles.loader} />
      ) : !workout ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{translate(language, "workoutNotFound")}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.date}>{formatWorkoutDate(workout.date)}</Text>
          <TextInput
            accessibilityLabel={translate(language, "workoutName")}
            onChangeText={(name) => updateGeneral({ name })}
            style={styles.title}
            value={translateWorkoutName(workout.name, language)}
          />
          <Text style={styles.subtitle}>
            {language === "sk" ? "Upravte dokončené série a všeobecné údaje tréningu." : "Edit completed sets and general workout details."}
          </Text>
          <View style={styles.generalCard}>
            <Text style={styles.generalTitle}>{translate(language, "general")}</Text>
            <View style={styles.generalRow}>
              <View style={styles.generalField}>
                <Text style={styles.generalLabel}>{translate(language, "workoutDate")}</Text>
                <TextInput
                  accessibilityLabel="Workout date"
                  autoCapitalize="none"
                  onChangeText={(value) => {
                    setDateInput(value);
                    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) updateGeneral({ date: `${value}T12:00:00` });
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#778177"
                  style={styles.generalInput}
                  value={dateInput}
                />
              </View>
              <View style={styles.generalField}>
                <Text style={styles.generalLabel}>{translate(language, "duration")}</Text>
                <TextInput
                  accessibilityLabel="Duration in minutes"
                  keyboardType="number-pad"
                  onChangeText={(value) => {
                    const duration = toNumber(value);
                    if (Number.isFinite(duration) && duration >= 0) updateGeneral({ duration });
                  }}
                  style={styles.generalInput}
                  value={String(workout.duration)}
                />
              </View>
            </View>
            <View style={styles.generalRow}>
              <View style={styles.generalField}>
                <Text style={styles.generalLabel}>
                  {translate(language, "currentWeight")} ({weightUnit})
                </Text>
                <TextInput
                  accessibilityLabel={`Current weight in ${weightUnit}`}
                  keyboardType="decimal-pad"
                  onChangeText={(value) => updateOptionalNumber("bodyWeight", value)}
                  placeholder="Optional"
                  placeholderTextColor="#778177"
                  style={styles.generalInput}
                  value={
                    workout.bodyWeight == null
                      ? ""
                      : String(weightUnit === "lbs" ? Number((workout.bodyWeight * poundsPerKilogram).toFixed(2)) : workout.bodyWeight)
                  }
                />
              </View>
              <View style={styles.generalField}>
                <Text style={styles.generalLabel}>{translate(language, "bodyFat")}</Text>
                <TextInput
                  accessibilityLabel="Body fat percentage"
                  keyboardType="decimal-pad"
                  onChangeText={(value) => updateOptionalNumber("bodyFatPercentage", value)}
                  placeholder="Optional"
                  placeholderTextColor="#778177"
                  style={styles.generalInput}
                  value={workout.bodyFatPercentage == null ? "" : String(workout.bodyFatPercentage)}
                />
              </View>
            </View>
            <Text style={styles.generalLabel}>{translate(language, "rating")}</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Pressable
                  accessibilityLabel={`Set rating to ${value}`}
                  accessibilityRole="button"
                  key={value}
                  onPress={() => updateGeneral({ rating: value })}
                >
                  <Text style={[styles.star, value <= (workout.rating ?? 0) && styles.starActive]}>★</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.generalLabel}>{translate(language, "notes")}</Text>
            <TextInput
              accessibilityLabel="Workout notes"
              multiline
              onChangeText={(notes) => updateGeneral({ notes })}
              placeholder="How did the workout feel?"
              placeholderTextColor="#778177"
              style={styles.notesInput}
              textAlignVertical="top"
              value={workout.notes ?? ""}
            />
          </View>
          <View style={styles.exercises}>
            {workout.exercises.map((exercise, exerciseIndex) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setCollapsedExercises((current) => ({ ...current, [exercise.id]: !current[exercise.id] }))}
                  style={styles.exerciseHeader}
                >
                  <Text style={styles.exerciseName}>{translateExerciseName(exercise.name, language)}</Text>
                  <Text style={styles.collapseIcon}>{collapsedExercises[exercise.id] ? "⌃" : "⌄"}</Text>
                </Pressable>
                {!collapsedExercises[exercise.id] && (
                  <>
                    <View style={styles.tableHeader}>
                      <Text style={styles.setNumber}>{language === "sk" ? "Séria" : "Set"}</Text>
                      <Text style={styles.columnLabel}>{translate(language, "reps")}</Text>
                      <Text style={styles.columnLabel}>{weightUnit}</Text>
                    </View>
                    {exercise.sets.map((set, setIndex) => (
                      <View key={`${exercise.id}-${setIndex}`} style={styles.setRow}>
                        <Text style={styles.setNumber}>
                          {language === "sk" ? "Séria" : "Set"} {setIndex + 1}
                        </Text>
                        <View style={styles.inputGroup}>
                          <TextInput
                            accessibilityLabel={`${exercise.name}, set ${setIndex + 1}, reps`}
                            keyboardType="decimal-pad"
                            onChangeText={(value) => updateSet(exerciseIndex, setIndex, "reps", value)}
                            selectTextOnFocus
                            style={styles.input}
                            value={String(set.reps)}
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <TextInput
                            accessibilityLabel={`${exercise.name}, set ${setIndex + 1}, ${weightUnit}`}
                            keyboardType="decimal-pad"
                            onChangeText={(value) => updateSet(exerciseIndex, setIndex, "weight", value)}
                            selectTextOnFocus
                            style={styles.input}
                            value={String(weightUnit === "lbs" ? Number((set.weight * poundsPerKilogram).toFixed(2)) : set.weight)}
                          />
                        </View>
                      </View>
                    ))}
                  </>
                )}
              </View>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={() => void save()}
            style={[styles.saveButton, isSaving && styles.disabled]}
          >
            {isSaving ? <ActivityIndicator color="#101510" /> : <Text style={styles.saveText}>{translate(language, "saveResults")}</Text>}
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>{translate(language, "backToWorkouts")}</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#101510", flex: 1 },
  content: { padding: 24, paddingBottom: 42 },
  loader: { marginTop: 48 },
  date: { color: "#B7F34A", fontSize: 13, fontWeight: "700", letterSpacing: 0.8 },
  title: { color: "#F7F8F5", fontSize: 30, fontWeight: "800", marginTop: 8, padding: 0 },
  subtitle: { color: "#A0AAA0", fontSize: 15, marginTop: 8 },
  generalCard: { backgroundColor: "#182019", borderColor: "#2B372C", borderRadius: 14, borderWidth: 1, marginTop: 24, padding: 16 },
  generalTitle: { color: "#B7F34A", fontSize: 17, fontWeight: "800", marginBottom: 16 },
  generalRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  generalField: { flex: 1 },
  generalLabel: { color: "#A0AAA0", fontSize: 12, fontWeight: "700", marginBottom: 6 },
  generalInput: {
    backgroundColor: "#101510",
    borderColor: "#405043",
    borderRadius: 8,
    borderWidth: 1,
    color: "#F7F8F5",
    fontSize: 15,
    height: 44,
    paddingHorizontal: 10,
  },
  ratingRow: { flexDirection: "row", gap: 7, marginBottom: 16 },
  star: { color: "#536153", fontSize: 27 },
  starActive: { color: "#B7F34A" },
  notesInput: {
    backgroundColor: "#101510",
    borderColor: "#405043",
    borderRadius: 8,
    borderWidth: 1,
    color: "#F7F8F5",
    fontSize: 15,
    minHeight: 88,
    padding: 10,
  },
  exercises: { gap: 14, marginTop: 26 },
  exerciseCard: { backgroundColor: "#182019", borderColor: "#2B372C", borderRadius: 14, borderWidth: 1, padding: 16 },
  exerciseHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  exerciseName: { color: "#F7F8F5", flex: 1, flexShrink: 1, fontSize: 18, fontWeight: "700" },
  collapseIcon: { color: "#B7F34A", flexShrink: 0, fontSize: 20, marginLeft: 12, textAlign: "center", width: 24 },
  tableHeader: { alignItems: "center", flexDirection: "row", marginTop: 14, paddingBottom: 7 },
  columnLabel: { color: "#A0AAA0", fontSize: 12, fontWeight: "700", textAlign: "center", width: 68 },
  setRow: { alignItems: "center", borderTopColor: "#2B372C", borderTopWidth: 1, flexDirection: "row", gap: 10, minHeight: 64, paddingVertical: 10 },
  setNumber: { color: "#A0AAA0", flex: 1, fontSize: 13 },
  inputGroup: { width: 68 },
  input: {
    alignSelf: "center",
    backgroundColor: "#101510",
    borderColor: "#405043",
    borderRadius: 8,
    borderWidth: 1,
    color: "#F7F8F5",
    fontSize: 16,
    height: 42,
    paddingHorizontal: 6,
    textAlign: "center",
    width: 68,
  },
  saveButton: { alignItems: "center", backgroundColor: "#B7F34A", borderRadius: 12, justifyContent: "center", marginTop: 24, minHeight: 52 },
  saveText: { color: "#101510", fontSize: 16, fontWeight: "800" },
  backButton: { alignItems: "center", padding: 16 },
  backText: { color: "#B7F34A", fontSize: 15, fontWeight: "700" },
  empty: { marginTop: 50 },
  emptyText: { color: "#A0AAA0", fontSize: 16, textAlign: "center" },
  disabled: { opacity: 0.65 },
});
