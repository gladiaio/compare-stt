/** Approximate 95% confidence margin for ELO based on match count (± rating points). */
export function computeConfidenceInterval(totalMatches: number): string {
  if (totalMatches < 1) return "—";
  const margin = Math.round((1.96 * 400) / Math.sqrt(totalMatches));
  return `±${Math.max(margin, 1)}`;
}
