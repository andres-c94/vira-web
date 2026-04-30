import { MissionExecution, Mood } from './mission.models';
import { ProgramMission } from './program.models';

export interface DashboardResponse {
  program: {
    id: string;
    title: string;
    totalDays: number;
  } | null;
  programStatus?: 'ACTIVE' | 'COMPLETED';
  programDay?: number;
  mission?: ProgramMission | null;
  missionExecutionStatus?: 'PENDING' | 'COMPLETED' | 'FAILED' | null;
  missionExecution?: MissionExecution | null;
  totalXP?: number;
  level?: number;
  currentStreak?: number;
  progressPercent?: number;
  mood?: Mood | null;
  completedDaysCount?: number;
  failedDaysCount?: number;
  message?: string;
}
