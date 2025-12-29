export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("Vectors must be same length");

  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai ** 2, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi ** 2, 0));

  return dot / (magA * magB);
}