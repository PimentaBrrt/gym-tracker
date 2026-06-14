import type { ReactNode } from "react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { IconLock } from "./Icons";

export default function SetupGuard({ children }: { children: ReactNode }) {
  if (isSupabaseConfigured) return <>{children}</>;
  return (
    <div className="gate">
      <div className="gate__logo"><IconLock width={34} height={34} /></div>
      <h1>Configuracao necessaria</h1>
      <p className="muted" style={{ maxWidth: 380 }}>
        Defina as variaveis <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> num
        arquivo <code>.env</code> (veja <code>.env.example</code>) e rode o script
        <code> supabase/schema.sql</code> no seu projeto Supabase. Depois reinicie o servidor.
      </p>
    </div>
  );
}
