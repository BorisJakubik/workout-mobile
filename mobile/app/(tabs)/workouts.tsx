import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/src/components/screen';
import { formatWorkoutDate, getWorkouts } from '@/src/services/workouts';
import type { Workout } from '@/src/types';

export default function WorkoutsScreen() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadWorkouts = useCallback(async () => {
    setIsLoading(true);
    try {
      setWorkouts(await getWorkouts());
    } catch (error) {
      Alert.alert('Could not load workouts', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkouts();
  }, [loadWorkouts]);

  return (
    <Screen>
      <Text style={styles.title}>Workouts</Text>
      <Text style={styles.description}>Open a workout to record and save your results.</Text>
      <Pressable accessibilityRole="button" onPress={() => void loadWorkouts()} style={styles.refreshButton}>
        <Text style={styles.refreshText}>Refresh</Text>
      </Pressable>
      {isLoading ? (
        <ActivityIndicator color="#B7F34A" style={styles.loader} />
      ) : workouts.length ? (
        <View style={styles.list}>
          {workouts.map(workout => (
            <Pressable key={workout.id} onPress={() => router.push(`/workout/${workout.id}`)} style={styles.workoutCard}>
              <Text style={styles.workoutName}>{workout.name}</Text>
              <Text style={styles.workoutMeta}>{formatWorkoutDate(workout.date)} · {workout.duration} min · {workout.exercises.length} exercises</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No workouts yet</Text>
          <Text style={styles.emptyText}>Completed workouts from FitTrack will appear here.</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: '#F7F8F5', fontSize: 32, fontWeight: '800' },
  description: { color: '#A0AAA0', fontSize: 16, lineHeight: 24, marginTop: 12 },
  refreshButton: { alignSelf: 'flex-start', marginTop: 18, paddingVertical: 8 },
  refreshText: { color: '#B7F34A', fontSize: 15, fontWeight: '700' },
  loader: { marginTop: 44 },
  list: { gap: 12, marginTop: 20 },
  workoutCard: { backgroundColor: '#182019', borderColor: '#2B372C', borderRadius: 14, borderWidth: 1, padding: 16 },
  workoutName: { color: '#F7F8F5', fontSize: 18, fontWeight: '700' },
  workoutMeta: { color: '#A0AAA0', fontSize: 14, lineHeight: 20, marginTop: 7 },
  emptyCard: { backgroundColor: '#182019', borderColor: '#2B372C', borderRadius: 14, borderWidth: 1, marginTop: 22, padding: 18 },
  emptyTitle: { color: '#F7F8F5', fontSize: 18, fontWeight: '700' },
  emptyText: { color: '#A0AAA0', fontSize: 14, lineHeight: 20, marginTop: 6 },
});
