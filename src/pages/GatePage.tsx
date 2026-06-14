import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { sha256, FAMILY_PASSWORD_HASH } from "@/lib/crypto";
import { settingsApi } from "@/lib/api";
import PasswordInput from "@/components/PasswordInput";
import { IconLock } from "@/components/Icons";

export default function GatePage() {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const unlockGate = useAuthStore((s) => s.unlockGate);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Hash atual vem do banco (admin pode trocar); fallback para o padrão.
    let expected = FAMILY_PASSWORD_HASH;
    try {
      const stored = await settingsApi.get("family_password_hash");
      if (stored) expected = stored;
    } catch { /* offline: usa o padrão */ }
    const ok = (await sha256(pw)) === expected;
    setLoading(false);
    if (ok) {
      unlockGate();
      nav("/profiles", { replace: true });
    } else {
      setError("Senha incorreta. Tente novamente.");
      setPw("");
      if (navigator.vibrate) navigator.vibrate(120);
    }
  };

  return (
    <div className="gate">
      <div className="gate__logo"><IconLock width={34} height={34} /></div>
      <div className="eyebrow">Gym Tracker</div>
      <h1>Acesso restrito</h1>
      <p className="muted">Digite a senha para entrar.</p>
      <form className="gate__form" onSubmit={submit}>
        <PasswordInput value={pw} onChange={setPw} placeholder="Senha" autoFocus />
        <div className="gate__error">{error}</div>
        <button className="btn btn--primary btn--block" disabled={loading || !pw}>
          {loading ? "Verificando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
