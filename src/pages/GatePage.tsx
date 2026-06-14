import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { matchesHash, FAMILY_PASSWORD_HASH } from "@/lib/crypto";
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
    const ok = await matchesHash(pw, FAMILY_PASSWORD_HASH);
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
      <div className="eyebrow">Family Gym Tracker</div>
      <h1>Acesso restrito</h1>
      <p className="muted">Digite a senha da familia para entrar.</p>
      <form className="gate__form" onSubmit={submit}>
        <input
          type="password" inputMode="text" autoFocus placeholder="Senha"
          value={pw} onChange={(e) => setPw(e.target.value)}
        />
        <div className="gate__error">{error}</div>
        <button className="btn btn--primary btn--block" disabled={loading || !pw}>
          {loading ? "Verificando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
