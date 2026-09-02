import { supabase } from "@/src/lib/supabase";
import type { Workout, WorkoutExercise } from "@/src/types";
import type { Language } from "@/src/providers/preferences-provider";

type ExerciseSetRow = { position: number; reps: number; weight: number | string };
type WorkoutExerciseRow = { exercise_id: string | null; exercise_name: string; exercise_sets: ExerciseSetRow[] | null; id: string; position: number };
type WorkoutRow = {
  body_fat_percentage: number | string | null;
  body_weight: number | string | null;
  category_id: string | null;
  completed: boolean;
  duration_minutes: number;
  id: string;
  notes: string | null;
  performed_at: string;
  rating: number | null;
  name: string;
  workout_exercises: WorkoutExerciseRow[] | null;
  workout_number: number | string | null;
};

const select = "*, workout_exercises(*, exercise_sets(*))";

const mapWorkout = (row: WorkoutRow): Workout => ({
  bodyFatPercentage: row.body_fat_percentage === null ? null : Number(row.body_fat_percentage),
  bodyWeight: row.body_weight === null ? null : Number(row.body_weight),
  categoryId: row.category_id,
  completed: row.completed,
  date: row.performed_at,
  duration: Number(row.duration_minutes),
  exercises: (row.workout_exercises ?? [])
    .slice()
    .sort((first, second) => first.position - second.position)
    .map<WorkoutExercise>((exercise) => ({
      exerciseId: exercise.exercise_id,
      id: exercise.id,
      name: exercise.exercise_name,
      sets: (exercise.exercise_sets ?? [])
        .slice()
        .sort((first, second) => first.position - second.position)
        .map((set) => ({ reps: Number(set.reps), weight: Number(set.weight) })),
    })),
  id: row.id,
  name: row.name,
  notes: row.notes ?? "",
  rating: row.rating ?? 0,
  workoutNumber: row.workout_number === null ? undefined : Number(row.workout_number),
});

export async function getWorkouts(): Promise<Workout[]> {
  const { data, error } = await supabase.from("workouts").select(select).order("performed_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as WorkoutRow[]).map(mapWorkout);
}

export async function getWorkoutById(id: string): Promise<Workout | null> {
  const { data, error } = await supabase.from("workouts").select(select).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapWorkout(data as unknown as WorkoutRow) : null;
}

export async function updateWorkout(workout: Workout): Promise<Workout> {
  const { error: workoutError } = await supabase
    .from("workouts")
    .update({
      body_fat_percentage: workout.bodyFatPercentage ?? null,
      body_weight: workout.bodyWeight ?? null,
      category_id: workout.categoryId ?? null,
      completed: workout.completed,
      duration_minutes: workout.duration,
      name: workout.name,
      notes: workout.notes ?? "",
      performed_at: workout.date,
      rating: workout.rating ?? 0,
    })
    .eq("id", workout.id);
  if (workoutError) throw workoutError;

  const { error: deleteError } = await supabase.from("workout_exercises").delete().eq("workout_id", workout.id);
  if (deleteError) throw deleteError;
  if (!workout.exercises.length) return (await getWorkoutById(workout.id))!;

  const { data: exerciseRows, error: exerciseError } = await supabase
    .from("workout_exercises")
    .insert(
      workout.exercises.map((exercise, position) => ({
        exercise_id: exercise.exerciseId ?? null,
        exercise_name: exercise.name,
        position,
        workout_id: workout.id,
      })),
    )
    .select("id");
  if (exerciseError) throw exerciseError;
  const createdExercises = exerciseRows as unknown as { id: string }[];
  const sets = workout.exercises.flatMap((exercise, exerciseIndex) =>
    exercise.sets.map((set, position) => ({ position, reps: set.reps, weight: set.weight, workout_exercise_id: createdExercises[exerciseIndex].id })),
  );
  if (sets.length) {
    const { error: setsError } = await supabase.from("exercise_sets").insert(sets);
    if (setsError) throw setsError;
  }
  return (await getWorkoutById(workout.id))!;
}

export async function createWorkout(workout: Omit<Workout, "id">): Promise<Workout> {
  const { data, error } = await supabase
    .from("workouts")
    .insert({
      body_fat_percentage: workout.bodyFatPercentage ?? null,
      body_weight: workout.bodyWeight ?? null,
      category_id: workout.categoryId ?? null,
      completed: workout.completed,
      duration_minutes: workout.duration,
      name: workout.name,
      notes: workout.notes ?? "",
      performed_at: workout.date,
      rating: workout.rating ?? 0,
    })
    .select("id")
    .single();
  if (error) throw error;

  const created = data as { id: string };
  if (!workout.exercises.length) return (await getWorkoutById(created.id))!;

  const { data: exerciseRows, error: exerciseError } = await supabase
    .from("workout_exercises")
    .insert(
      workout.exercises.map((exercise, position) => ({
        exercise_id: exercise.exerciseId ?? null,
        exercise_name: exercise.name,
        position,
        workout_id: created.id,
      })),
    )
    .select("id");
  if (exerciseError) throw exerciseError;

  const createdExercises = exerciseRows as unknown as { id: string }[];
  const sets = workout.exercises.flatMap((exercise, exerciseIndex) =>
    exercise.sets.map((set, position) => ({ position, reps: set.reps, weight: set.weight, workout_exercise_id: createdExercises[exerciseIndex].id })),
  );
  if (sets.length) {
    const { error: setsError } = await supabase.from("exercise_sets").insert(sets);
    if (setsError) throw setsError;
  }
  return (await getWorkoutById(created.id))!;
}

export const formatWorkoutDate = (value: string, language?: Language) =>
  new Intl.DateTimeFormat(language === "sk" ? "sk-SK" : undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
