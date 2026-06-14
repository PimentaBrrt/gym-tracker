import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Cliente unico. Quando as variaveis nao estao configuradas, expomos um
// cliente "vazio" e a UI mostra a tela de setup (ver SetupGuard).
export const supabase: SupabaseClient = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder-key",
  { auth: { persistSession: false } }
);
