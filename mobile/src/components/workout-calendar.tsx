import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Workout } from '@/src/types';

type WorkoutCalendarProps = {
  onSelectWorkout: (workout: Workout) => void;
  workouts: Workout[];
};

const toDateKey = (value: Date | string) => {
  const date = typeof value === 'string' ? new Date(value) : value;
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

export function WorkoutCalendar({ onSelectWorkout, workouts }: WorkoutCalendarProps) {
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));
  const workoutDates = useMemo(() => new Set(workouts.map(workout => toDateKey(workout.date))), [workouts]);
  const selectedWorkouts = workouts.filter(workout => toDateKey(workout.date) === selectedDate);
  const leadingDays = (new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay() + 6) % 7;
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const cells = [...Array<null>(leadingDays).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  const title = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(visibleMonth);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Previous month" onPress={() => setVisibleMonth(month => new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={styles.monthButton}><Text style={styles.monthButtonText}>‹</Text></Pressable>
        <Text style={styles.monthTitle}>{title}</Text>
        <Pressable accessibilityLabel="Next month" onPress={() => setVisibleMonth(month => new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={styles.monthButton}><Text style={styles.monthButtonText}>›</Text></Pressable>
      </View>
      <View style={styles.weekdays}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>)}</View>
      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (!day) return <View key={`empty-${index}`} style={styles.day} />;
          const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
          const dateKey = toDateKey(date);
          const isSelected = dateKey === selectedDate;
          const hasWorkout = workoutDates.has(dateKey);
          return (
            <Pressable key={dateKey} onPress={() => setSelectedDate(dateKey)} style={[styles.day, isSelected && styles.selectedDay]}>
              <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{day}</Text>
              {hasWorkout && <View style={[styles.dot, isSelected && styles.selectedDot]} />}
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.selectedTitle}>{new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date(`${selectedDate}T12:00:00`))}</Text>
      {selectedWorkouts.length ? selectedWorkouts.map(workout => (
        <Pressable key={workout.id} onPress={() => onSelectWorkout(workout)} style={styles.result}>
          <Text style={styles.resultName}>{workout.name}</Text>
          <Text style={styles.resultMeta}>{workout.duration} min · {workout.exercises.length} exercises</Text>
        </Pressable>
      )) : <Text style={styles.noResult}>No workout recorded on this day.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#182019', borderColor: '#2B372C', borderRadius: 14, borderWidth: 1, marginTop: 24, padding: 14 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  monthButton: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  monthButtonText: { color: '#B7F34A', fontSize: 30, lineHeight: 32 },
  monthTitle: { color: '#F7F8F5', fontSize: 16, fontWeight: '700', textTransform: 'capitalize' },
  weekdays: { flexDirection: 'row', marginTop: 12 },
  weekday: { color: '#A0AAA0', flex: 1, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  day: { alignItems: 'center', height: 40, justifyContent: 'center', width: '14.2857%' },
  dayText: { color: '#D6DBD5', fontSize: 14 },
  selectedDay: { backgroundColor: '#B7F34A', borderRadius: 20 },
  selectedDayText: { color: '#101510', fontWeight: '800' },
  dot: { backgroundColor: '#B7F34A', borderRadius: 3, bottom: 4, height: 5, position: 'absolute', width: 5 },
  selectedDot: { backgroundColor: '#101510' },
  selectedTitle: { color: '#F7F8F5', fontSize: 15, fontWeight: '700', marginTop: 18 },
  result: { borderTopColor: '#2B372C', borderTopWidth: 1, paddingVertical: 12, marginTop: 10 },
  resultName: { color: '#F7F8F5', fontSize: 16, fontWeight: '700' },
  resultMeta: { color: '#A0AAA0', fontSize: 13, marginTop: 4 },
  noResult: { color: '#A0AAA0', fontSize: 14, marginTop: 10 },
});
