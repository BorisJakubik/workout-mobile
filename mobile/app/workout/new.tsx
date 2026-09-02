import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Stack, useRouter } from "expo-router";

import { getCatalog, type CatalogCategory, type CatalogExercise } from "@/src/services/catalog";
import { createWorkout } from "@/src/services/workouts";
import type { WorkoutExercise } from "@/src/types";
import { translate, translateExerciseName, translateWorkoutName } from "@/src/i18n";
import { usePreferences } from "@/src/providers/preferences-provider";

const today = () => new Date().toISOString().slice(0, 10);

export default function NewWorkoutScreen() {
  const router = useRouter();
  const { language } = usePreferences();
  const [catalog, setCatalog] = useState<CatalogExercise[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [name, setName] = useState("Workout");
  const [date, setDate] = useState(today());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getCatalog()
      .then(({ categories: loadedCategories, exercises: loadedExercises }) => {
        setCategories(loadedCategories);
        setCatalog(loadedExercises);
      })
      .catch((error) => Alert.alert("Could not load exercise library", error instanceof Error ? error.message : "Please try again."))
      .finally(() => setIsLoading(false));
  }, []);

  const addExercise = (exercise: CatalogExercise) => {
    if (exercises.some((item) => item.exerciseId === exercise.id)) return;
    setExercises((current) => [...current, { exerciseId: exercise.id, id: exercise.id, name: exercise.name, sets: [{ reps: 0, weight: 0 }] }]);
  };

  const selectCategory = (category: CatalogCategory) => {
    setCategoryId(category.id);
    if (name === "Workout") setName(category.name);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: "reps" | "weight", value: string) => {
    const number = Number(value.replace(",", "."));
    if (!Number.isFinite(number) || number < 0) return;
    setExercises((current) =>
      current.map((exercise, currentExerciseIndex) =>
        currentExerciseIndex !== exerciseIndex
          ? exercise
          : {
              ...exercise,
              sets: exercise.sets.map((set, currentSetIndex) => (currentSetIndex !== setIndex ? set : { ...set, [field]: number })),
            },
      ),
    );
  };

  const save = async () => {
    if (!name.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert("Check workout details", "Enter a workout name and a date in YYYY-MM-DD format.");
      return;
    }
    if (!exercises.length) {
      Alert.alert("Add an exercise", "Choose at least one exercise from your library.");
      return;
    }
    setIsSaving(true);
    try {
      const workout = await createWorkout({ categoryId, completed: true, date: `${date}T12:00:00`, duration: 0, exercises, name: name.trim() });
      router.replace(`/workout/${workout.id}`);
    } catch (error) {
      Alert.alert("Could not save workout", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Stack.Screen
        options={{
          headerBackTitle: translate(language, "workouts"),
          headerShown: true,
          headerStyle: { backgroundColor: "#101510" },
          headerTintColor: "#F7F8F5",
          title: translate(language, "newWorkout"),
        }}
      />
      <Text style={styles.title}>{translate(language, "newWorkout")}</Text>
      <Text style={styles.subtitle}>
        {language === "sk" ? "Začnite s cvikmi z knižnice FitTrack." : "Start with exercises from your FitTrack library."}
      </Text>
      <Text style={styles.label}>{translate(language, "workoutName")}</Text>
      <TextInput onChangeText={setName} style={styles.input} value={name} />
      <Text style={styles.label}>{translate(language, "workoutDate")}</Text>
      <TextInput
        autoCapitalize="none"
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#778177"
        style={styles.input}
        value={date}
      />
      <Text style={styles.sectionTitle}>{translate(language, "workoutType")}</Text>
      <Text style={styles.sectionHint}>
        {language === "sk"
          ? "Vyberte jeden z typov, ktoré už máte v knižnici FitTrack."
          : "Choose one of the types already in your FitTrack library."}
      </Text>
      <View style={styles.categoryList}>
        {categories.map((category) => (
          <Pressable
            accessibilityRole="button"
            key={category.id}
            onPress={() => selectCategory(category)}
            style={[styles.categoryButton, categoryId === category.id && styles.categoryButtonSelected]}
          >
            <Text style={[styles.categoryButtonText, categoryId === category.id && styles.categoryButtonTextSelected]}>
              {translateWorkoutName(category.name, language)}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.sectionTitle}>{language === "sk" ? "Vybrané cviky" : "Selected exercises"}</Text>
      {exercises.length ? (
        exercises.map((exercise, exerciseIndex) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{translateExerciseName(exercise.name, language)}</Text>
              <Pressable onPress={() => setExercises((current) => current.filter((_, index) => index !== exerciseIndex))}>
                <Text style={styles.remove}>{translate(language, "remove")}</Text>
              </Pressable>
            </View>
            {exercise.sets.map((set, setIndex) => (
              <View key={setIndex} style={styles.setRow}>
                <Text style={styles.setLabel}>
                  {language === "sk" ? "Séria" : "Set"} {setIndex + 1}
                </Text>
                <TextInput
                  keyboardType="decimal-pad"
                  onChangeText={(value) => updateSet(exerciseIndex, setIndex, "reps", value)}
                  style={styles.setInput}
                  value={String(set.reps)}
                />
                <TextInput
                  keyboardType="decimal-pad"
                  onChangeText={(value) => updateSet(exerciseIndex, setIndex, "weight", value)}
                  style={styles.setInput}
                  value={String(set.weight)}
                />
              </View>
            ))}
            <Pressable
              onPress={() =>
                setExercises((current) =>
                  current.map((item, index) => (index !== exerciseIndex ? item : { ...item, sets: [...item.sets, { reps: 0, weight: 0 }] })),
                )
              }
            >
              <Text style={styles.addSet}>{translate(language, "addSet")}</Text>
            </Pressable>
          </View>
        ))
      ) : (
        <Text style={styles.empty}>{translate(language, "noExercises")}</Text>
      )}
      <Text style={styles.sectionTitle}>{translate(language, "exerciseLibrary")}</Text>
      {isLoading ? (
        <ActivityIndicator color="#B7F34A" />
      ) : (
        catalog
          .filter((exercise) => !categoryId || exercise.categoryId === categoryId)
          .map((exercise) => (
            <Pressable
              disabled={exercises.some((item) => item.exerciseId === exercise.id)}
              key={exercise.id}
              onPress={() => addExercise(exercise)}
              style={[styles.libraryRow, exercises.some((item) => item.exerciseId === exercise.id) && styles.libraryRowDisabled]}
            >
              <Text style={styles.libraryName}>{translateExerciseName(exercise.name, language)}</Text>
              <Text style={styles.add}>{translate(language, "add")}</Text>
            </Pressable>
          ))
      )}
      <Pressable disabled={isSaving} onPress={() => void save()} style={[styles.saveButton, isSaving && styles.disabled]}>
        {isSaving ? <ActivityIndicator color="#101510" /> : <Text style={styles.saveText}>{translate(language, "createWorkout")}</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#101510", flex: 1 },
  content: { padding: 24, paddingBottom: 42 },
  title: { color: "#F7F8F5", fontSize: 30, fontWeight: "800" },
  subtitle: { color: "#A0AAA0", fontSize: 15, marginTop: 8 },
  label: { color: "#A0AAA0", fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 18 },
  input: {
    backgroundColor: "#182019",
    borderColor: "#405043",
    borderRadius: 8,
    borderWidth: 1,
    color: "#F7F8F5",
    fontSize: 16,
    height: 46,
    paddingHorizontal: 12,
  },
  sectionTitle: { color: "#B7F34A", fontSize: 17, fontWeight: "800", marginTop: 28 },
  sectionHint: { color: "#A0AAA0", fontSize: 14, lineHeight: 20, marginTop: 6 },
  categoryList: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  categoryButton: { borderColor: "#405043", borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9 },
  categoryButtonSelected: { backgroundColor: "#B7F34A", borderColor: "#B7F34A" },
  categoryButtonText: { color: "#F7F8F5", fontSize: 14, fontWeight: "700" },
  categoryButtonTextSelected: { color: "#101510" },
  empty: { color: "#A0AAA0", marginTop: 12 },
  exerciseCard: { backgroundColor: "#182019", borderColor: "#2B372C", borderRadius: 12, borderWidth: 1, marginTop: 12, padding: 14 },
  exerciseHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  exerciseName: { color: "#F7F8F5", fontSize: 16, fontWeight: "700" },
  remove: { color: "#FF9D96", fontWeight: "700" },
  setRow: { alignItems: "center", flexDirection: "row", gap: 8, marginTop: 12 },
  setLabel: { color: "#A0AAA0", flex: 1 },
  setInput: {
    backgroundColor: "#101510",
    borderColor: "#405043",
    borderRadius: 8,
    borderWidth: 1,
    color: "#F7F8F5",
    height: 38,
    paddingHorizontal: 8,
    textAlign: "center",
    width: 70,
  },
  addSet: { color: "#B7F34A", fontWeight: "700", marginTop: 14 },
  libraryRow: {
    alignItems: "center",
    borderBottomColor: "#2B372C",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 52,
  },
  libraryRowDisabled: { opacity: 0.45 },
  libraryName: { color: "#F7F8F5", flex: 1, fontSize: 16 },
  add: { color: "#B7F34A", fontWeight: "700" },
  saveButton: { alignItems: "center", backgroundColor: "#B7F34A", borderRadius: 12, justifyContent: "center", marginTop: 28, minHeight: 52 },
  saveText: { color: "#101510", fontSize: 16, fontWeight: "800" },
  disabled: { opacity: 0.65 },
});
