-- ============================================================
-- Gym Tracker — esquema Supabase / PostgreSQL
-- Rode este script no SQL Editor do seu projeto Supabase.
-- Pode ser executado de novo com seguranca (idempotente).
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- USERS (perfis estilo Netflix) ----------
create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text,
  is_admin    boolean not null default false,
  avatar_hue  int not null default 220,
  created_at  timestamptz not null default now()
);

-- ---------- WORKOUTS (dias de treino) ----------
create table if not exists public.workouts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);

-- ---------- EXERCISES ----------
create table if not exists public.exercises (
  id             uuid primary key default gen_random_uuid(),
  workout_id     uuid not null references public.workouts(id) on delete cascade,
  name           text not null,
  current_weight numeric not null default 0,   -- carga representativa (maior serie); usada nos graficos/stats
  sets           int not null default 3,        -- numero de series
  reps           int not null default 10,       -- repeticoes por serie
  weights        jsonb not null default '[]'::jsonb, -- carga de cada serie (pode variar)
  rest_time      int not null default 90,
  notes          text,
  position       int not null default 0,
  created_at     timestamptz not null default now()
);

-- ---------- WORKOUT SESSIONS (execucoes concluidas) ----------
create table if not exists public.workout_sessions (
  id           uuid primary key default gen_random_uuid(),
  workout_id   uuid not null references public.workouts(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete cascade,
  completed_at timestamptz not null default now()
);

-- ---------- EXERCISE HISTORY ----------
create table if not exists public.exercise_history (
  id                 uuid primary key default gen_random_uuid(),
  exercise_id        uuid not null references public.exercises(id) on delete cascade,
  workout_session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_name      text not null,
  weight             numeric not null,
  created_at         timestamptz not null default now()
);

-- ---------- EXERCISE LIBRARY (favoritos / biblioteca pessoal) ----------
create table if not exists public.exercise_library (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  name           text not null,
  default_weight numeric not null default 0,
  default_sets   int not null default 3,
  default_reps   int not null default 10,
  default_weights jsonb not null default '[]'::jsonb,
  default_notes  text,
  default_rest   int not null default 90,
  created_at     timestamptz not null default now()
);

-- ---------- WORKOUT TEMPLATES (treinos favoritos / compartilhaveis) ----------
create table if not exists public.workout_templates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  name       text not null,
  exercises  jsonb not null default '[]'::jsonb, -- snapshot dos exercicios do treino
  created_at timestamptz not null default now()
);
create index if not exists idx_templates_user on public.workout_templates(user_id);

-- ---------- Migracoes para bases ja existentes (idempotentes) ----------
alter table public.exercises         add column if not exists sets int not null default 3;
alter table public.exercises         add column if not exists reps int not null default 10;
alter table public.exercises         add column if not exists weights jsonb not null default '[]'::jsonb;
alter table public.exercise_library  add column if not exists default_sets int not null default 3;
alter table public.exercise_library  add column if not exists default_reps int not null default 10;
alter table public.exercise_library  add column if not exists default_weights jsonb not null default '[]'::jsonb;
alter table public.exercise_library  add column if not exists default_notes text;

-- ---------- APP SETTINGS (senhas editaveis pelo admin, guardadas como hash) ----------
create table if not exists public.app_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_workouts_user      on public.workouts(user_id);
create index if not exists idx_exercises_workout   on public.exercises(workout_id);
create index if not exists idx_sessions_workout    on public.workout_sessions(workout_id);
create index if not exists idx_sessions_user       on public.workout_sessions(user_id);
create index if not exists idx_history_exercise    on public.exercise_history(exercise_id);
create index if not exists idx_library_user        on public.exercise_library(user_id);

-- ---------- Usuario Admin (vem pre-criado) ----------
insert into public.users (name, is_admin, avatar_hue)
select 'Admin', true, 225
where not exists (select 1 from public.users where is_admin = true);

-- ---------- Hashes de senha padrao (SHA-256) ----------
-- family_password_hash  -> "Family123@"
-- admin_password_hash   -> "AdministratorAccess3103@"
insert into public.app_settings (key, value) values
  ('family_password_hash', '7007c82e58094a6555e4ccc355be1971b57f813fca397dc544e229fefa393e9a')
on conflict (key) do nothing;
insert into public.app_settings (key, value) values
  ('admin_password_hash', 'fe21c25ac4db51dc7d13a4d0d1c0f969b5782fb343f12b14defc6aa0faa73d26')
on conflict (key) do nothing;

-- ============================================================
-- RLS (app familiar com a anon key). Ajuste se desejar isolamento.
-- ============================================================
alter table public.users            enable row level security;
alter table public.workouts         enable row level security;
alter table public.exercises        enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.exercise_history enable row level security;
alter table public.exercise_library enable row level security;
alter table public.workout_templates enable row level security;
alter table public.app_settings     enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'users','workouts','exercises','workout_sessions','exercise_history','exercise_library','workout_templates','app_settings'
  ] loop
    execute format('drop policy if exists "anon_all_%1$s" on public.%1$s;', t);
    execute format(
      'create policy "anon_all_%1$s" on public.%1$s for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;
