export type FailureReason =
  | 'SYSTEM_TIMEOUT'
  | 'NO_TIME'
  | 'FORGOT'
  | 'NO_MOTIVATION'
  | 'TOO_DIFFICULT'
  | 'OTHER';

export type Mood = 'BAD' | 'NORMAL' | 'GOOD';

export interface MissionExecution {
  id: string;
  programDay: number;
  localDate: string;
  status: 'COMPLETED' | 'FAILED';
  failureReason?: FailureReason | null;
  isAutoFailed: boolean;
  durationMinutes?: number | null;
  difficultyRating?: number | null;
  socialMediaMinutes?: number | null;
  reflection?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;
}

export interface CompleteMissionPayload {
  durationMinutes: number;
  difficultyRating: number;
  socialMediaMinutes: number;
  reflection?: string | null;
  mood?: Mood | null;
}

export interface FailMissionPayload {
  reason: Exclude<FailureReason, 'SYSTEM_TIMEOUT'>;
  mood?: Mood | null;
}

export interface RecordMoodPayload {
  mood: Mood;
}
