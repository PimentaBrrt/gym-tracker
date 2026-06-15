export interface User {
  id: string;
  name: string;
  email: string | null;
  is_admin: boolean;
  avatar_hue: number;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Exercise {
  id: string;
  workout_id: string;
  name: string;
  current_weight: number; // carga representativa (maior serie) p/ graficos/stats
  sets: number;           // numero de series
  reps: number;           // repeticoes por serie
  weights: number[];      // carga de cada serie (pode variar)
  rest_time: number;
  notes: string | null;
  position: number;
  created_at: string;
}

export interface WorkoutSession {
  id: string;
  workout_id: string;
  user_id: string;
  completed_at: string;
}

export interface ExerciseHistory {
  id: string;
  exercise_id: string;
  workout_session_id: string;
  exercise_name: string;
  weight: number;
  created_at: string;
}

export interface LibraryExercise {
  id: string;
  user_id: string;
  name: string;
  default_weight: number;
  default_sets: number;
  default_reps: number;
  default_weights: number[];
  default_notes: string | null;
  default_rest: number;
  created_at: string;
}

export interface WorkoutWithMeta extends Workout {
  exerciseCount: number;
  lastCompletedAt: string | null;
  sessionCount: number;
}

export interface TemplateExercise {
  name: string;
  sets: number;
  reps: number;
  weights: number[];
  rest_time: number;
  notes: string | null;
  position: number;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  exercises: TemplateExercise[];
  created_at: string;
}
