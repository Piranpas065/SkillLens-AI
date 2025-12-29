export interface InterviewFeedback {
  score: number; // 1-10
  feedback: string; // Written feedback (strengths, weaknesses)
  improved?: string; // Suggested improved answer (optional, STAR format)
  tags?: string[]; // Tags like "Too generic", "Needs clarity", etc.
}
