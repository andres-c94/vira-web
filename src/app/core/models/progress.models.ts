export interface ProgressSummary {
  completedDaysCount: number;
  failedDaysCount: number;
  totalDays: number;
  progressPercent: number;
  totalXP: number;
  level: number;
  currentStreak: number;
  averageSocialMediaMinutes: number | null;
}
