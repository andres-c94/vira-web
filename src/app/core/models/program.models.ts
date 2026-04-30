export interface Program {
  id: string;
  slug: string;
  title: string;
  description: string;
  totalDays: number;
  accessType: 'FREE' | 'LOCKED_BETA' | 'PAID';
  betaInterestCount: number;
  isActive: boolean;
}

export interface ProgramInterestResponse {
  message: string;
  programId: string;
  betaInterestCount: number;
}

export interface ProgramMission {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  structuralDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
  xpReward: number;
}

export interface UserProgram {
  id: string;
  userId: string;
  programId: string;
  startedAt: string;
  completedAt: string | null;
  status: 'ACTIVE' | 'COMPLETED';
  currentProgramDay: number;
  currentStreak: number;
  totalXP: number;
  level: number;
  lockedTimezone: string;
  lastSyncedAt: string | null;
}

export interface ActiveUserProgramResponse {
  userProgram: UserProgram | null;
  message?: string;
}
