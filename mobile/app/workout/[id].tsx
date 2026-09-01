import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { formatWorkoutDate, getWorkoutById, updateWorkout } from '@/src/services/workouts';
import type { Workout } from '@/src/types';

const toNumber = (value: string) => Number(value.replace(',', '.'));

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadWorkout = async () => {
      try {
        setWorkout(await getWorkoutById(id));
      } catch (error) {
        Alert.alert('Could not load workout', error instanceof Error ? error.message : 'Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    void loadWorkout();
  }, [id]);

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: string) => {
    const number = toNumber(value);
    if (!Number.isFinite(number) || number < 0) return;
    setWorkout(current => {
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
      Alert.alert('Saved', 'Workout results have been saved.');
    } catch (error) {
      Alert.alert('Could not save workout', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, headerStyle: { backgroundColor: '#101510' }, headerTintColor: '#F7F8F5', title: 'Workout' }} />
      {isLoading ? (
        <ActivityIndicator color="#B7F34A" style={styles.loader} />
      ) : !workout ? (
        <View style={styles.empty}><Text style={styles.emptyText}>Workout not found.</Text></View>
      ) : (
        <>
          <Text style={styles.date}>{formatWorkoutDate(workout.date)}</Text>
          <Text style={styles.title}>{workout.name}</Text>
          <Text style={styles.subtitle}>{workout.duration} min · Edit completed sets below.</Text>
          <View style={styles.exercises}>
            {workout.exercises.map((exercise, exerciseIndex) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                {exercise.sets.map((set, setIndex) => (
                  <View key={`${exercise.id}-${setIndex}`} style={styles.setRow}>
                    <Text style={styles.setNumber}>Set {setIndex + 1}</Text>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Reps</Text>
                      <TextInput keyboardType="decimal-pad" onChangeText={value => updateSet(exerciseIndex, setIndex, 'reps', value)} selectTextOnFocus style={styles.input} value={String(set.reps)} />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>kg</Text>
                      <TextInput keyboardType="decimal-pad" onChangeText={value => updateSet(exerciseIndex, setIndex, 'weight', value)} selectTextOnFocus style={styles.input} value={String(set.weight)} />
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
          <Pressable accessibilityRole="button" disabled={isSaving} onPress={() => void save()} style={[styles.saveButton, isSaving && styles.disabled]}>
            {isSaving ? <ActivityIndicator color="#101510" /> : <Text style={styles.saveText}>Save results</Text>}
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>Back to workouts</Text></Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#101510', flex: 1 },
  content: { padding: 24, paddingBottom: 42 },
  loader: { marginTop: 48 },
  date: { color: '#B7F34A', fontSize: 13, fontWeight: '700', letterSpacing: 0.8 },
  title: { color: '#F7F8F5', fontSize: 30, fontWeight: '800', marginTop: 8 },
  subtitle: { color: '#A0AAA0', fontSize: 15, marginTop: 8 },
  exercises: { gap: 14, marginTop: 26 },
  exerciseCard: { backgroundColor: '#182019', borderColor: '#2B372C', borderRadius: 14, borderWidth: 1, padding: 16 },
  exerciseName: { color: '#F7F8F5', fontSize: 18, fontWeight: '700', marginBottom: 14 },
  setRow: { alignItems: 'flex-end', borderTopColor: '#2B372C', borderTopWidth: 1, flexDirection: 'row', gap: 10, paddingTop: 12, marginTop: 10 },
  setNumber: { color: '#A0AAA0', flex: 1, fontSize: 13, paddingBottom: 12 },
  inputGroup: { width: 68 },
  inputLabel: { color: '#A0AAA0', fontSize: 12, marginBottom: 5 },
  input: { backgroundColor: '#101510', borderColor: '#405043', borderRadius: 8, borderWidth: 1, color: '#F7F8F5', fontSize: 16, paddingHorizontal: 9, paddingVertical: 10, textAlign: 'center' },
  saveButton: { alignItems: 'center', backgroundColor: '#B7F34A', borderRadius: 12, justifyContent: 'center', marginTop: 24, minHeight: 52 },
  saveText: { color: '#101510', fontSize: 16, fontWeight: '800' },
  backButton: { alignItems: 'center', padding: 16 },
  backText: { color: '#B7F34A', fontSize: 15, fontWeight: '700' },
  empty: { marginTop: 50 },
  emptyText: { color: '#A0AAA0', fontSize: 16, textAlign: 'center' },
  disabled: { opacity: 0.65 },
});
