import { useState } from "react";
import type { Exercise } from "@/types";
import { useExerciseHistory } from "@/hooks/useHistory";
import { exWeights, formatWeights } from "@/lib/exercise";
import RestTimer from "./RestTimer";
import WeightChart from "./WeightChart";
import { IconCheck, IconEdit, IconTrash, IconChart, IconStar, IconReset } from "./Icons";

interface Props {
  exercise: Exercise;
  count: number;
  onIncr: () => void;
  onResetCount: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onFavorite: () => void;
}

export default function ExerciseCard({ exercise, count, onIncr, onResetCount, onEdit, onDelete, onFavorite }: Props) {
  const [open, setOpen] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const { data: history } = useExerciseHistory(open ? exercise.id : undefined);
  const weights = exWeights(exercise);
  const sets = Math.max(1, exercise.sets || 1);
  const done = count >= sets;

  return (
    <div className={"exercise-card" + (done ? " is-done" : "")}>
      <div className="exercise-card__main">
        <button
          className={"set-counter" + (done ? " is-done" : "")}
          onClick={onIncr}
          disabled={done}
          aria-label="Adicionar série"
          title="Adicionar série"
        >
          {done
            ? <IconCheck width={20} height={20} />
            : <span className="set-counter__num numeric">{count}<span className="set-counter__den">/{sets}</span></span>}
        </button>

        <div className="exercise-card__info" onClick={() => setOpen((v) => !v)}>
          <div className="exercise-card__name">{exercise.name}</div>
          <div className="exercise-card__meta numeric">
            <span className="sets">{exercise.sets} × {exercise.reps}</span>
            <span className="dot">·</span>
            <span className="weight">{formatWeights(weights)}</span>
            <span className="dot">·</span>
            <span>descanso {exercise.rest_time}s</span>
          </div>
          {weights.length > 1 && !weights.every((w) => w === weights[0]) && (
            <div className="exercise-card__sets numeric">
              {weights.map((w, i) => <span key={i} className="set-pill">S{i + 1}: {w}kg</span>)}
            </div>
          )}
          {exercise.notes && <div className="exercise-card__notes">{exercise.notes}</div>}
        </div>

        {count > 0 && (
          <button className="btn btn--icon btn--ghost btn--sm" onClick={onResetCount} aria-label="Reiniciar contagem de séries" title="Reiniciar contagem">
            <IconReset width={17} height={17} />
          </button>
        )}
        <button className="btn btn--icon btn--ghost btn--sm" onClick={() => setOpen((v) => !v)} aria-label="Detalhes">
          <IconChart width={18} height={18} />
        </button>
      </div>

      {/* Mantido montado mesmo colapsado (display:none) para o timer nao parar. */}
      <div className="exercise-card__expand" style={{ display: (open || timerActive) ? "flex" : "none" }}>
        <RestTimer defaultSeconds={exercise.rest_time} onActiveChange={setTimerActive} />
        {open && (
          <>
            <div className="exercise-card__chart">
              <div className="eyebrow" style={{ marginBottom: 8 }}>Evolução de carga média</div>
              <WeightChart history={history ?? []} />
            </div>
            <div className="row wrap" style={{ gap: 8 }}>
              <button className="btn btn--ghost btn--sm" onClick={onEdit}><IconEdit width={16} height={16} /> Editar</button>
              <button className="btn btn--ghost btn--sm" onClick={onFavorite}><IconStar width={16} height={16} /> Favoritar</button>
              <button className="btn btn--danger btn--sm" onClick={onDelete}><IconTrash width={16} height={16} /> Excluir</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
