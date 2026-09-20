/**
 * Projette la valeur de la période suivante à partir d'une tendance simple
 * (régression linéaire par moindres carrés) sur une série de valeurs
 * passées, indexées 0..n-1. C'est une estimation d'ordre de grandeur, pas
 * une prédiction garantie — à ne jamais présenter comme un engagement de
 * revenu.
 */
export function linearForecast(values: number[]): number {
  const n = values.length;
  if (n === 0) return 0;
  if (n === 1) return Math.max(0, Math.round(values[0]));

  const xMean = (n - 1) / 2;
  const yMean = values.reduce((sum, v) => sum + v, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += (i - xMean) ** 2;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;
  const projected = slope * n + intercept;

  return Math.max(0, Math.round(projected));
}
