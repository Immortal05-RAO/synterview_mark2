import type { InterviewConfig } from '../api/interviews';

export interface TrendPoint {
  session: string;
  overall: number;
}

// Oldest-first score series built from completed interviews that have a score.
export const buildTrend = (interviews: InterviewConfig[]): TrendPoint[] =>
  interviews
    .filter((i) => i.status === 'COMPLETED' && typeof i.overallScore === 'number')
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((i, idx) => ({ session: `S${idx + 1}`, overall: Math.round(i.overallScore as number) }));
