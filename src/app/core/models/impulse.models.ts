export type ImpulseStatus =
  | 'ACTIVE_BLOCK'
  | 'BLOCK_COMPLETED'
  | 'BETWEEN_BLOCKS'
  | 'ALL_DONE'
  | 'MISSION_NOT_COMPLETED';

export type ImpulseActionStatus = 'AVAILABLE' | 'COMPLETED';

export interface ImpulseAction {
  id: string;
  taskId: string;
  taskText: string;
  category: 'fisico' | 'orden' | 'mental' | 'social' | string;
  status: ImpulseActionStatus;
  xpEarned: number;
}

export interface ImpulseCurrentBlock {
  id: string;
  blockIndex: number;
  label: string;
  startTime: string;
  endTime: string;
  status: 'ACTIVE' | 'COMPLETED' | 'MISSED';
  xpEarned: number;
  xpMax: number;
  completedCount: number;
  tasksMax: number;
  actions: ImpulseAction[];
}

export interface ImpulseTodayResponse {
  enabled: boolean;
  localDate?: string;
  status: ImpulseStatus;
  currentBlock?: ImpulseCurrentBlock | null;
  daily?: {
    xpEarned: number;
    xpMax: number;
    blocksCompleted: number;
    blocksAvailable: number;
    actionsCompleted: number;
  };
  nextBlock?: {
    blockIndex: number;
    startTime: string;
    endTime: string;
  } | null;
  serverMessage?: string | null;
  message?: string;
}

export interface ImpulseQueryPayload {
  localDate: string;
  currentTime: string;
}
