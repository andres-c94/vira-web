export type LeaderboardTodayStatus =
  | 'COMPLETED_TODAY'
  | 'PENDING_TODAY'
  | 'FAILED_TODAY'
  | 'INACTIVE_TODAY'
  | 'PROGRAM_COMPLETED';

export interface LeaderboardEntry {
  position: number;
  displayName: string;
  isCurrentUser?: boolean;
  currentStreak: number;
  completedDaysCount: number;
  failedDaysCount?: number;
  totalXP?: number;
  level: number;
  todayStatus: LeaderboardTodayStatus;
  impulseTodayXp: number;
  impulseBlocksCompletedToday: number;
  impulseActionsCompletedToday: number;
}

export interface LeaderboardResponse {
  enabled: boolean;
  message?: string;
  userRank?: LeaderboardEntry | null;
  zone?: LeaderboardEntry[];
  top?: LeaderboardEntry[];
  summary?: {
    totalParticipants: number;
    completedTodayCount: number;
    pendingTodayCount: number;
    failedTodayCount: number;
    impulseActiveTodayCount: number;
    impulseAllBlocksCompletedCount: number;
  };
}

export interface LeaderboardProfile {
  globalLeaderboardOptIn: boolean;
  displayName: string | null;
  publicAlias: string;
}

export interface UpdateLeaderboardProfilePayload {
  globalLeaderboardOptIn: boolean;
  displayName: string | null;
}
