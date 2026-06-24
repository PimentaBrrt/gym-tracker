import type { Exercise } from "@/types";

// Cargas efetivas: usa o array weights; se vazio (dado antigo), preenche com a
// carga representativa repetida pelo numero de series.
export function exWeights(ex: Pick<Exercise, "weights" | "sets" | "current_weight">): number[] {
  const arr = Array.isArray(ex.weights) ? ex.weights.map(Number).filter((n) => !Number.isNaN(n)) : [];
  if (arr.length) return arr;
  const n = Math.max(1, ex.sets || 1);
  return Array(n).fill(Number(ex.current_weight) || 0);
}

// Texto compacto das cargas: "80 kg" se todas iguais, senao "80/82/85 kg".
export function formatWeights(weights: number[]): string {
  if (!weights.length) return "0 kg";
  const allSame = weights.every((w) => w === weights[0]);
  return allSame ? `${weights[0]} kg` : `${weights.join("/")} kg`;
}

export const maxWeight = (weights: number[]): number =>
  weights.length ? Math.max(...weights) : 0;

// Carga media entre as series (arredondada a 2 casas).
export const avgWeight = (weights: number[]): number =>
  weights.length ? Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 100) / 100 : 0;
