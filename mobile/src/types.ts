export type ExerciseSet = {
  reps: number;
  weight: number;
};

export type WorkoutExercise = {
  exerciseId?: string | null;
  id: string;
  name: string;
  sets: ExerciseSet[];
};

export type Workout = {
  bodyFatPercentage?: number | null;
  bodyWeight?: number | null;
  categoryId?: string | null;
  completed: boolean;
  date: string;
  duration: number;
  exercises: WorkoutExercise[];
  id: string;
  name: string;
  notes?: string;
  rating?: number;
  workoutNumber?: number;
};
