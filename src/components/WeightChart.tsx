import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import type { ExerciseHistory } from "@/types";

interface Props { history: ExerciseHistory[]; }

export default function WeightChart({ history }: Props) {
  if (history.length < 1) {
    return <p className="muted" style={{ fontSize: 14 }}>Sem dados de evolução ainda.</p>;
  }
  const data = history.map((h, i) => ({
    exec: i + 1,
    carga: Number(h.weight),
    label: new Date(h.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
  }));
  const weights = data.map((d) => d.carga);
  const min = Math.min(...weights), max = Math.max(...weights);
  const pad = Math.max(2, (max - min) * 0.2);

  return (
    <div style={{ width: "100%", height: 180 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="rgba(150,153,140,0.14)" vertical={false} />
          <XAxis dataKey="exec" tick={{ fill: "#96998C", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            domain={[Math.max(0, min - pad), max + pad]}
            tick={{ fill: "#96998C", fontSize: 11 }} axisLine={false} tickLine={false} width={42}
          />
          <Tooltip
            contentStyle={{ background: "#0e2424", border: "1px solid rgba(150,153,140,0.28)", borderRadius: 12, color: "#E9EBE6" }}
            labelFormatter={(v) => `Execução ${v}`}
            formatter={(v: number) => [`${v} kg`, "Carga"]}
          />
          <Line
            type="monotone" dataKey="carga" stroke="#4169E1" strokeWidth={3}
            dot={{ r: 4, fill: "#6495ED", strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#6495ED" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
