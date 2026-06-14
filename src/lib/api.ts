import { supabase } from "./supabase";
import type {
  User, Workout, Exercise, WorkoutSession, ExerciseHistory, LibraryExercise,
} from "@/types";

function ok<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  return data as T;
}

// ---------------- USERS ----------------
export const usersApi = {
  async list(): Promise<User[]> {
    const { data, error } = await supabase
      .from("users").select("*").order("is_admin", { ascending: false }).order("created_at");
    return ok(data, error);
  },
  async create(name: string, avatar_hue: number): Promise<User> {
    const { data, error } = await supabase
      .from("users").insert({ name, avatar_hue }).select().single();
    return ok(data, error);
  },
  async update(id: string, patch: Partial<Pick<User, "name" | "avatar_hue">>): Promise<User> {
    const { data, error } = await supabase
      .from("users").update(patch).eq("id", id).select().single();
    return ok(data, error);
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("users").delete().eq("id", id).eq("is_admin", false);
    if (error) throw new Error(error.message);
  },
};

// ---------------- WORKOUTS ----------------
export const workoutsApi = {
  async listByUser(userId: string): Promise<Workout[]> {
    const { data, error } = await supabase
      .from("workouts").select("*").eq("user_id", userId).order("created_at");
    return ok(data, error);
  },
  async create(userId: string, name: string): Promise<Workout> {
    const { data, error } = await supabase
      .from("workouts").insert({ user_id: userId, name }).select().single();
    return ok(data, error);
  },
  async rename(id: string, name: string): Promise<Workout> {
    const { data, error } = await supabase
      .from("workouts").update({ name }).eq("id", id).select().single();
    return ok(data, error);
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("workouts").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
  async get(id: string): Promise<Workout> {
    const { data, error } = await supabase.from("workouts").select("*").eq("id", id).single();
    return ok(data, error);
  },
};

// ---------------- EXERCISES ----------------
export const exercisesApi = {
  async listByWorkout(workoutId: string): Promise<Exercise[]> {
    const { data, error } = await supabase
      .from("exercises").select("*").eq("workout_id", workoutId).order("position").order("created_at");
    return ok(data, error);
  },
  async create(workoutId: string, input: {
    name: string; current_weight: number; sets: number; reps: number; weights: number[];
    rest_time: number; notes?: string | null; position?: number;
  }): Promise<Exercise> {
    const { data, error } = await supabase
      .from("exercises").insert({ workout_id: workoutId, ...input }).select().single();
    return ok(data, error);
  },
  async update(id: string, patch: Partial<Exercise>): Promise<Exercise> {
    const { data, error } = await supabase
      .from("exercises").update(patch).eq("id", id).select().single();
    return ok(data, error);
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("exercises").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

// ---------------- SESSIONS + HISTORY ----------------
export const sessionsApi = {
  async listByUser(userId: string): Promise<WorkoutSession[]> {
    const { data, error } = await supabase
      .from("workout_sessions").select("*").eq("user_id", userId).order("completed_at", { ascending: false });
    return ok(data, error);
  },
  async listByWorkout(workoutId: string): Promise<WorkoutSession[]> {
    const { data, error } = await supabase
      .from("workout_sessions").select("*").eq("workout_id", workoutId).order("completed_at", { ascending: false });
    return ok(data, error);
  },
  // Cria a execucao do treino + grava a carga de cada exercicio no historico.
  async complete(workoutId: string, userId: string, exercises: Exercise[]): Promise<WorkoutSession> {
    const { data: session, error: sErr } = await supabase
      .from("workout_sessions").insert({ workout_id: workoutId, user_id: userId }).select().single();
    if (sErr) throw new Error(sErr.message);
    const rows = exercises.map((e) => ({
      exercise_id: e.id,
      workout_session_id: (session as WorkoutSession).id,
      exercise_name: e.name,
      weight: e.current_weight,
    }));
    if (rows.length) {
      const { error: hErr } = await supabase.from("exercise_history").insert(rows);
      if (hErr) throw new Error(hErr.message);
    }
    return session as WorkoutSession;
  },
};

export const historyApi = {
  async listByExercise(exerciseId: string): Promise<ExerciseHistory[]> {
    const { data, error } = await supabase
      .from("exercise_history").select("*").eq("exercise_id", exerciseId).order("created_at");
    return ok(data, error);
  },
  async listByUser(userId: string): Promise<ExerciseHistory[]> {
    // historico de todas as sessoes do usuario
    const { data: sessions, error: sErr } = await supabase
      .from("workout_sessions").select("id").eq("user_id", userId);
    if (sErr) throw new Error(sErr.message);
    const ids = (sessions ?? []).map((s) => s.id);
    if (!ids.length) return [];
    const { data, error } = await supabase
      .from("exercise_history").select("*").in("workout_session_id", ids).order("created_at");
    return ok(data, error);
  },
};

// ---------------- LIBRARY (favoritos) ----------------
export const libraryApi = {
  async listByUser(userId: string): Promise<LibraryExercise[]> {
    const { data, error } = await supabase
      .from("exercise_library").select("*").eq("user_id", userId).order("name");
    return ok(data, error);
  },
  async add(userId: string, input: { name: string; default_weight: number; default_sets: number; default_reps: number; default_weights: number[]; default_notes?: string | null; default_rest: number }): Promise<LibraryExercise> {
    // Idempotente: se ja existe um favorito com o mesmo nome (case-insensitive)
    // para este usuario, atualiza os specs em vez de criar um duplicado.
    const { data: existing, error: findErr } = await supabase
      .from("exercise_library")
      .select("*")
      .eq("user_id", userId)
      .ilike("name", input.name)
      .limit(1);
    if (findErr) throw new Error(findErr.message);
    if (existing && existing.length > 0) {
      const { data, error } = await supabase
        .from("exercise_library")
        .update({ default_weight: input.default_weight, default_sets: input.default_sets, default_reps: input.default_reps, default_weights: input.default_weights, default_notes: input.default_notes ?? null, default_rest: input.default_rest })
        .eq("id", existing[0].id)
        .select()
        .single();
      return ok(data, error);
    }
    const { data, error } = await supabase
      .from("exercise_library").insert({ user_id: userId, ...input }).select().single();
    return ok(data, error);
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("exercise_library").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

// ---------------- APP SETTINGS (senhas editaveis) ----------------
export const settingsApi = {
  async get(key: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("app_settings").select("value").eq("key", key).maybeSingle();
    if (error) throw new Error(error.message);
    return data?.value ?? null;
  },
  async set(key: string, value: string): Promise<void> {
    const { error } = await supabase
      .from("app_settings").upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
  },
};
