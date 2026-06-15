import { useEffect, useRef, useState } from "react";
import { IconPlay, IconPause, IconReset } from "./Icons";

interface Props { defaultSeconds: number; }

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function RestTimer({ defaultSeconds }: Props) {
  const [total, setTotal] = useState(defaultSeconds);
  const [remaining, setRemaining] = useState(defaultSeconds);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  const endAtRef = useRef<number | null>(null);   // timestamp absoluto do fim
  const tickRef = useRef<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const firedRef = useRef(false);

  useEffect(() => { setTotal(defaultSeconds); setRemaining(defaultSeconds); }, [defaultSeconds]);

  // Cria/retoma o AudioContext DENTRO de um gesto do usuario (toque no play).
  // Sem isso o som nao toca no celular (so no desktop).
  const ensureAudio = () => {
    try {
      if (!audioRef.current) {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioRef.current = new Ctx();
      }
      if (audioRef.current.state === "suspended") void audioRef.current.resume();
    } catch { /* audio indisponivel */ }
    return audioRef.current;
  };

  const alarm = () => {
    const ctx = audioRef.current;
    if (ctx && ctx.state === "running") {
      try {
        const t0 = ctx.currentTime;
        const beep = (freq: number, start: number, dur: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = freq;
          osc.connect(gain); gain.connect(ctx.destination);
          gain.gain.setValueAtTime(0.0001, t0 + start);
          gain.gain.exponentialRampToValueAtTime(0.5, t0 + start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur);
          osc.start(t0 + start);
          osc.stop(t0 + start + dur);
        };
        beep(880, 0, 0.22); beep(1175, 0.26, 0.22); beep(1568, 0.52, 0.32);
      } catch { /* ignore */ }
    }
    // Vibracao: funciona no Android (em primeiro plano). iOS Safari nao suporta.
    if (typeof navigator.vibrate === "function") navigator.vibrate([300, 150, 300, 150, 400]);
  };

  const stopTick = () => { if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; } };

  const fire = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    stopTick();
    endAtRef.current = null;
    setRunning(false);
    setRemaining(0);
    setFinished(true);
    alarm();
  };

  const startTick = () => {
    stopTick();
    tickRef.current = window.setInterval(() => {
      const end = endAtRef.current;
      if (end == null) return;
      const rem = Math.max(0, Math.round((end - Date.now()) / 1000));
      setRemaining(rem);
      if (Date.now() >= end) fire();
    }, 250);
  };

  const play = () => {
    ensureAudio();
    if (finished) { restart(); return; }
    firedRef.current = false;
    endAtRef.current = Date.now() + remaining * 1000;
    setRunning(true);
    startTick();
  };
  const pause = () => {
    if (endAtRef.current != null) setRemaining(Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000)));
    endAtRef.current = null;
    stopTick();
    setRunning(false);
  };
  const restart = () => {
    stopTick(); endAtRef.current = null; firedRef.current = false;
    setRunning(false); setFinished(false); setRemaining(total);
  };
  const toggle = () => { if (finished) restart(); else if (running) pause(); else play(); };

  const adjust = (delta: number) => {
    setFinished(false); firedRef.current = false;
    setTotal((t) => Math.max(15, t + delta));
    setRemaining((r) => {
      const nr = Math.max(running ? 0 : 15, r + delta);
      if (running) endAtRef.current = Date.now() + nr * 1000;
      return nr;
    });
  };

  // Ao voltar para o app, recalcula pelo timestamp (corrige a pausa do timer em
  // segundo plano) e dispara o alarme se ja tinha acabado enquanto estava fora.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      const end = endAtRef.current;
      if (end == null) return;
      const rem = Math.max(0, Math.round((end - Date.now()) / 1000));
      setRemaining(rem);
      if (Date.now() >= end) fire();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => () => stopTick(), []);

  const pct = total > 0 ? (remaining / total) * 100 : 0;
  const R = 34, C = 2 * Math.PI * R;

  return (
    <div className={"rest-timer" + (finished ? " is-finished" : "")}>
      <div className="rest-timer__dial">
        <svg viewBox="0 0 80 80" width="80" height="80">
          <circle cx="40" cy="40" r={R} className="rt-track" />
          <circle
            cx="40" cy="40" r={R} className="rt-progress"
            style={{ strokeDasharray: C, strokeDashoffset: C - (pct / 100) * C }}
          />
        </svg>
        <div className="rest-timer__time numeric">{fmt(remaining)}</div>
      </div>

      <div className="rest-timer__controls">
        <button className="btn btn--ghost btn--sm" onClick={() => adjust(-15)}>-15s</button>
        <button className="btn btn--primary btn--icon" onClick={toggle} aria-label="play/pause">
          {running ? <IconPause /> : <IconPlay />}
        </button>
        <button className="btn btn--ghost btn--icon" onClick={restart} aria-label="reiniciar"><IconReset /></button>
        <button className="btn btn--ghost btn--sm" onClick={() => adjust(15)}>+15s</button>
      </div>
    </div>
  );
}
