import { useEffect, useRef, useState } from "react";
import { IconPlay, IconPause, IconReset } from "./Icons";

interface Props { defaultSeconds: number; }

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const play = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };
    play(880, 0, 0.18);
    play(1320, 0.2, 0.25);
    setTimeout(() => ctx.close(), 800);
  } catch { /* audio indisponivel */ }
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function RestTimer({ defaultSeconds }: Props) {
  const [total, setTotal] = useState(defaultSeconds);
  const [remaining, setRemaining] = useState(defaultSeconds);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const ref = useRef<number | null>(null);

  useEffect(() => { setTotal(defaultSeconds); setRemaining(defaultSeconds); }, [defaultSeconds]);

  useEffect(() => {
    if (!running) return;
    ref.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(ref.current!);
          setRunning(false);
          setFinished(true);
          beep();
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (ref.current) window.clearInterval(ref.current); };
  }, [running]);

  const adjust = (delta: number) => {
    setFinished(false);
    setTotal((t) => Math.max(15, t + delta));
    setRemaining((r) => Math.max(15, r + delta));
  };
  const toggle = () => { if (finished) restart(); else setRunning((v) => !v); };
  const restart = () => { setRunning(false); setFinished(false); setRemaining(total); };

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
