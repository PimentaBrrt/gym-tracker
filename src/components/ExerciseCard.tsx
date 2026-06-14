import { useState } from "react";
import type { Exercise } from "@/types";
import { useExerciseHistory } from "@/hooks/useHistory";
import { exWeights, formatWeights } from "@/lib/exercise";
import RestTimer from "./RestTimer";
import WeightChart from "./WeightChart";
import { IconCheck, IconEdit, IconTrash, IconChart, IconStar } from "./Icons";

interface Props {
  exercise: Exercise;
  done: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onFavorite: () => void;
}

export default function ExerciseCard({ exercise, done, onToggle, onEdit, onDelete, onFavorite }: Props) {
  const [open, setOpen] = useState(false);
  const { data: history } = useExerciseHistory(open ? exercise.id : undefined);
  const weights = exWeights(exercise);

  return (
    <div className={"exercise-card" + (done ? " is-done" : "")}>
      <div className="exercise-card__main">
        <button
          className={"checkbox" + (done ? " is-checked" : "")}
          onClick={onToggle}
          aria-label={done ? "Desmarcar" : "Concluir"}
        >
          <IconCheck width={16} height={16} />
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
              {weights.map((w, i) => (
                <span key={i} className="set-pill">S{i + 1}: {w}kg</span>
              ))}
            </div>
          )}
          {exercise.notes && <div className="exercise-card__notes">{exercise.notes}</div>}
        </div>

        <button className="btn btn--icon btn--ghost btn--sm" onClick={() => setOpen((v) => !v)} aria-label="Detalhes">
          <IconChart width={18} height={18} />
        </button>
      </div>

      {open && (
        <div className="exercise-card__expand fade-in">
          <RestTimer defaultSeconds={exercise.rest_time} />
          <div className="exercise-card__chart">
            <div className="eyebrow" style={{ marginBottom: 8 }}>Evolução de carga</div>
            <WeightChart history={history ?? []} />
          </div>
          <div className="row wrap" style={{ gap: 8 }}>
            <button className="btn btn--ghost btn--sm" onClick={onEdit}><IconEdit width={16} height={16} /> Editar</button>
            <button className="btn btn--ghost btn--sm" onClick={onFavorite}><IconStar width={16} height={16} /> Favoritar</button>
            <button className="btn btn--danger btn--sm" onClick={onDelete}><IconTrash width={16} height={16} /> Excluir</button>
          </div>
        </div>
      )}
    </div>
  );
}
