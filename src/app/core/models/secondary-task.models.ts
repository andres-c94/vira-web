export type SecondaryTaskCategory = 'fisico' | 'orden' | 'mental' | 'social';

export interface SecondaryTask {
  id: string;
  text: string;
  category: SecondaryTaskCategory;
  effort: 1 | 2 | 3;
  durationSec: number;
  noveltyWeight: number;
  requiresDelay?: boolean;
  cooldownMin?: number;
  antiSpamTag: string;
}

export interface ImpulseBlockDefinition {
  index: number;
  key: string;
  label: string;
  rangeLabel: string;
  startHour: number;
  endHour: number;
}

export interface ImpulseBlockState {
  taskIds: string[];
  completedTaskIds: string[];
  xpEarned: number;
  completed: boolean;
}

export interface SecondaryTaskStorageState {
  date: string;
  blocks: Record<string, ImpulseBlockState>;
  dailyXpEarned: number;
  timesUsed: Record<string, number>;
  cooldowns: Record<string, number>;
}

export interface SecondaryTaskView extends SecondaryTask {
  state: 'idle' | 'completing' | 'completed' | 'disabled';
  xpPreview: number | null;
  xpAwarded: number | null;
  disabled: boolean;
  doneLabel: string | null;
}

export type ImpulseMode = 'active' | 'block-complete' | 'locked' | 'day-complete';

export interface ImpulseBlockSnapshot {
  mode: ImpulseMode;
  currentBlock: ImpulseBlockDefinition | null;
  nextBlock: ImpulseBlockDefinition | null;
  countdownMs: number | null;
  visibleTasks: SecondaryTaskView[];
  blockXpEarned: number;
  dailyXpEarned: number;
  blockCompletedCount: number;
}
