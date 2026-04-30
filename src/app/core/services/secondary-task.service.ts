import { Injectable, computed, signal } from '@angular/core';
import { SECONDARY_TASKS } from '../constants/secondary-tasks.constants';
import {
  ImpulseBlockDefinition,
  ImpulseBlockSnapshot,
  ImpulseBlockState,
  SecondaryTask,
  SecondaryTaskCategory,
  SecondaryTaskStorageState,
  SecondaryTaskView
} from '../models/secondary-task.models';

const IMPULSE_BLOCKS: readonly ImpulseBlockDefinition[] = [
  { index: 1, key: '08:00-11:00', label: 'Impulso 1/4', rangeLabel: '08:00-11:00', startHour: 8, endHour: 11 },
  { index: 2, key: '11:00-14:00', label: 'Impulso 2/4', rangeLabel: '11:00-14:00', startHour: 11, endHour: 14 },
  { index: 3, key: '14:00-17:00', label: 'Impulso 3/4', rangeLabel: '14:00-17:00', startHour: 14, endHour: 17 },
  { index: 4, key: '17:00-20:00', label: 'Impulso 4/4', rangeLabel: '17:00-20:00', startHour: 17, endHour: 20 }
] as const;

@Injectable({ providedIn: 'root' })
export class SecondaryTaskService {
  private readonly storageKey = 'modoAventura.impulseBlocks.state';
  private readonly maxTasksPerBlock = 5;
  private readonly maxBlockXp = 12;
  private readonly maxDailyXp = 48;
  private readonly persistentState = this.loadState();
  private readonly revision = signal(0);
  private readonly nowState = signal(Date.now());
  private readonly snapshotState = signal<ImpulseBlockSnapshot>(this.buildSnapshot());
  private readonly globalCooldownUntilState = signal(0);
  private readonly cooldownActiveState = signal(false);
  private cooldownTimerId: number | null = null;

  readonly visibleTasks = computed(() => this.snapshotState().visibleTasks);
  readonly mode = computed(() => this.snapshotState().mode);
  readonly currentBlock = computed(() => this.snapshotState().currentBlock);
  readonly nextBlock = computed(() => this.snapshotState().nextBlock);
  readonly countdownMs = computed(() => this.snapshotState().countdownMs);
  readonly blockXp = computed(() => this.snapshotState().blockXpEarned);
  readonly todayXp = computed(() => this.snapshotState().dailyXpEarned);
  readonly completedCount = computed(() => this.snapshotState().blockCompletedCount);
  readonly cooldownActive = this.cooldownActiveState.asReadonly();
  readonly blockProgress = computed(() => Math.min((this.blockXp() / this.maxBlockXp) * 100, 100));
  readonly dayProgress = computed(() => Math.min((this.todayXp() / this.maxDailyXp) * 100, 100));

  constructor() {
    this.startClock();
    this.prepareTasks();
  }

  prepareTasks(): void {
    this.refreshAndPublish();
  }

  touchActivity(): void {
    this.refreshAndPublish();
  }

  requestCompletion(taskId: string): 'started' | 'cooldown' | 'ignored' {
    this.refreshAndPublish();

    const snapshot = this.snapshotState();
    if (snapshot.mode !== 'active') {
      return 'ignored';
    }

    if (this.cooldownActive()) {
      return 'cooldown';
    }

    const task = snapshot.visibleTasks.find((item) => item.id === taskId);
    if (!task || task.disabled || task.state === 'completed' || task.state === 'completing') {
      return 'ignored';
    }

    this.snapshotState.set({
      ...snapshot,
      visibleTasks: snapshot.visibleTasks.map((item) =>
        item.id === taskId ? { ...item, state: 'completing' } : item
      )
    });

    return 'started';
  }

  finalizeCompletion(taskId: string): void {
    this.refreshPersistentState();

    const snapshot = this.snapshotState();
    const currentBlock = snapshot.currentBlock;
    if (snapshot.mode !== 'active' || !currentBlock) {
      return;
    }

    const blockState = this.ensureBlockState(currentBlock);
    if (
      blockState.completed ||
      !blockState.taskIds.includes(taskId) ||
      blockState.completedTaskIds.includes(taskId)
    ) {
      return;
    }

    const nextOrder = blockState.completedTaskIds.length + 1;
    const xpAwarded = this.xpForOrder(nextOrder);

    blockState.completedTaskIds = [...blockState.completedTaskIds, taskId];
    blockState.xpEarned = Math.min(
      this.maxBlockXp,
      blockState.completedTaskIds.reduce((total, _, index) => total + this.xpForOrder(index + 1), 0)
    );
    blockState.completed =
      blockState.completedTaskIds.length >= this.maxTasksPerBlock || blockState.xpEarned >= this.maxBlockXp;

    this.persistentState.timesUsed[taskId] = (this.persistentState.timesUsed[taskId] ?? 0) + 1;

    const task = SECONDARY_TASKS.find((item) => item.id === taskId);
    if (task?.cooldownMin) {
      this.persistentState.cooldowns[taskId] = Date.now() + task.cooldownMin * 60 * 1000;
    }

    this.recalculateDerivedFields();
    this.persistState();
    this.startGlobalCooldown(this.randomBetween(1000, 1500));

    const nextSnapshot = this.buildSnapshot();
    const keepVisibleTasks = nextSnapshot.mode === 'active' || nextSnapshot.mode === 'block-complete';
    this.snapshotState.set({
      ...nextSnapshot,
      visibleTasks: keepVisibleTasks
        ? nextSnapshot.visibleTasks.map((item) =>
            item.id === taskId
              ? {
                  ...item,
                  state: 'completed',
                  xpAwarded,
                  doneLabel: 'hecho'
                }
              : item
          )
        : nextSnapshot.visibleTasks
    });
    this.revision.update((value) => value + 1);
  }

  private startClock(): void {
    window.setInterval(() => {
      this.nowState.set(Date.now());
      this.refreshAndPublish(false);
    }, 1000);
  }

  private refreshAndPublish(forcePersist = true): void {
    const changed = this.refreshPersistentState(forcePersist);
    const nextSnapshot = this.buildSnapshot();

    if (changed || !this.areSnapshotsEqual(this.snapshotState(), nextSnapshot)) {
      this.snapshotState.set(nextSnapshot);
      this.revision.update((value) => value + 1);
    }
  }

  private refreshPersistentState(forcePersist = true): boolean {
    const today = this.getDateKey(this.nowState());
    let changed = false;

    if (this.persistentState.date !== today) {
      const timesUsed = { ...this.persistentState.timesUsed };
      const cooldowns = { ...this.persistentState.cooldowns };
      this.persistentState.date = today;
      this.persistentState.blocks = {};
      this.persistentState.dailyXpEarned = 0;
      this.persistentState.timesUsed = timesUsed;
      this.persistentState.cooldowns = cooldowns;
      changed = true;
    }

    const now = Date.now();
    const prunedCooldowns = Object.fromEntries(
      Object.entries(this.persistentState.cooldowns).filter(([, until]) => until > now)
    );

    if (Object.keys(prunedCooldowns).length !== Object.keys(this.persistentState.cooldowns).length) {
      this.persistentState.cooldowns = prunedCooldowns;
      changed = true;
    }

    const beforeDailyXp = this.persistentState.dailyXpEarned;
    const normalizedBlocks = this.normalizeBlocks(this.persistentState.blocks);
    if (normalizedBlocks.changed) {
      this.persistentState.blocks = normalizedBlocks.blocks;
      changed = true;
    }

    this.recalculateDerivedFields();
    if (beforeDailyXp !== this.persistentState.dailyXpEarned) {
      changed = true;
    }

    if (forcePersist && changed) {
      this.persistState();
    }

    return changed;
  }

  private normalizeBlocks(blocks: Record<string, ImpulseBlockState>): {
    blocks: Record<string, ImpulseBlockState>;
    changed: boolean;
  } {
    let changed = false;
    const normalized: Record<string, ImpulseBlockState> = {};

    for (const [key, block] of Object.entries(blocks)) {
      const uniqueTaskIds = Array.from(new Set(block.taskIds ?? []));
      const validCompletedIds = Array.from(new Set(block.completedTaskIds ?? [])).filter((taskId) =>
        uniqueTaskIds.includes(taskId)
      );
      const xpEarned = validCompletedIds.reduce((total, _, index) => total + this.xpForOrder(index + 1), 0);
      const completed =
        validCompletedIds.length >= this.maxTasksPerBlock || xpEarned >= this.maxBlockXp || block.completed;

      if (
        uniqueTaskIds.length !== (block.taskIds ?? []).length ||
        validCompletedIds.length !== (block.completedTaskIds ?? []).length ||
        xpEarned !== block.xpEarned ||
        completed !== block.completed
      ) {
        changed = true;
      }

      normalized[key] = {
        taskIds: uniqueTaskIds,
        completedTaskIds: validCompletedIds,
        xpEarned,
        completed
      };
    }

    return { blocks: normalized, changed };
  }

  private recalculateDerivedFields(): void {
    this.persistentState.dailyXpEarned = Object.values(this.persistentState.blocks).reduce(
      (total, block) => total + block.xpEarned,
      0
    );
  }

  private buildSnapshot(): ImpulseBlockSnapshot {
    this.revision();
    const now = new Date(this.nowState());
    const hour = now.getHours();
    const currentBlock = this.getCurrentBlock(hour);
    const nextFutureBlock = this.getNextFutureBlock(hour);
    const allCompleted = IMPULSE_BLOCKS.every((block) => this.persistentState.blocks[block.key]?.completed);
    const dailyXpEarned = this.persistentState.dailyXpEarned;
    const afterLastBlock = hour >= IMPULSE_BLOCKS[IMPULSE_BLOCKS.length - 1].endHour;

    if (allCompleted || (!currentBlock && !nextFutureBlock && afterLastBlock)) {
      return {
        mode: 'day-complete',
        currentBlock: null,
        nextBlock: null,
        countdownMs: null,
        visibleTasks: [],
        blockXpEarned: 0,
        dailyXpEarned,
        blockCompletedCount: 0
      };
    }

    if (!currentBlock && nextFutureBlock) {
      return {
        mode: 'locked',
        currentBlock: null,
        nextBlock: nextFutureBlock,
        countdownMs: this.msUntilHour(now, nextFutureBlock.startHour),
        visibleTasks: [],
        blockXpEarned: 0,
        dailyXpEarned,
        blockCompletedCount: 0
      };
    }

    if (!currentBlock) {
      return {
        mode: 'day-complete',
        currentBlock: null,
        nextBlock: null,
        countdownMs: null,
        visibleTasks: [],
        blockXpEarned: 0,
        dailyXpEarned,
        blockCompletedCount: 0
      };
    }

    this.ensureBlockGenerated(currentBlock);
    const blockState = this.ensureBlockState(currentBlock);
    const blockCompleted =
      blockState.completed ||
      blockState.completedTaskIds.length >= this.maxTasksPerBlock ||
      blockState.xpEarned >= this.maxBlockXp;
    const visibleTasks = blockState.taskIds
      .map((taskId) => SECONDARY_TASKS.find((task) => task.id === taskId))
      .filter((task): task is SecondaryTask => Boolean(task))
      .map((task) => this.toView(task, blockState));

    if (blockCompleted && !nextFutureBlock) {
      return {
        mode: 'day-complete',
        currentBlock: null,
        nextBlock: null,
        countdownMs: null,
        visibleTasks: [],
        blockXpEarned: 0,
        dailyXpEarned,
        blockCompletedCount: this.maxTasksPerBlock
      };
    }

    return {
      mode: blockCompleted ? 'block-complete' : 'active',
      currentBlock,
      nextBlock: blockCompleted ? nextFutureBlock : null,
      countdownMs: blockCompleted && nextFutureBlock ? this.msUntilHour(now, nextFutureBlock.startHour) : null,
      visibleTasks,
      blockXpEarned: blockState.xpEarned,
      dailyXpEarned,
      blockCompletedCount: blockState.completedTaskIds.length
    };
  }

  private ensureBlockGenerated(block: ImpulseBlockDefinition): void {
    const blockState = this.persistentState.blocks[block.key];
    if (blockState?.taskIds.length) {
      return;
    }

    const taskIds = this.generateBlockTaskIds();
    this.persistentState.blocks[block.key] = {
      taskIds,
      completedTaskIds: [],
      xpEarned: 0,
      completed: false
    };
    this.persistState();
  }

  private ensureBlockState(block: ImpulseBlockDefinition): ImpulseBlockState {
    if (!this.persistentState.blocks[block.key]) {
      this.persistentState.blocks[block.key] = {
        taskIds: [],
        completedTaskIds: [],
        xpEarned: 0,
        completed: false
      };
    }

    return this.persistentState.blocks[block.key];
  }

  private generateBlockTaskIds(): string[] {
    const chosen: SecondaryTask[] = [];
    const selectedIds = new Set<string>();
    const selectedTags = new Set<string>();
    const completedTodayIds = new Set(this.getCompletedTaskIdsToday());
    const categories: SecondaryTaskCategory[] = ['fisico', 'orden', 'mental'];

    for (const category of categories) {
      const task = this.pickWeightedTask({
        category,
        selectedIds,
        selectedTags,
        completedTodayIds
      });

      if (task) {
        chosen.push(task);
        selectedIds.add(task.id);
        selectedTags.add(task.antiSpamTag);
      }
    }

    while (chosen.length < this.maxTasksPerBlock) {
      const task = this.pickWeightedTask({
        selectedIds,
        selectedTags,
        completedTodayIds
      });

      if (!task) {
        break;
      }

      chosen.push(task);
      selectedIds.add(task.id);
      selectedTags.add(task.antiSpamTag);
    }

    this.ensureRequiresDelayQuota(chosen, selectedIds, selectedTags, completedTodayIds);

    return chosen.slice(0, this.maxTasksPerBlock).map((task) => task.id);
  }

  private ensureRequiresDelayQuota(
    chosen: SecondaryTask[],
    selectedIds: Set<string>,
    selectedTags: Set<string>,
    completedTodayIds: Set<string>
  ): void {
    let delayedCount = chosen.filter((task) => task.requiresDelay).length;

    while (delayedCount < 2) {
      const replacement = this.pickWeightedTask({
        selectedIds,
        selectedTags,
        completedTodayIds,
        requiresDelay: true
      });

      if (!replacement) {
        return;
      }

      const replaceIndex = chosen.findIndex((task) => !task.requiresDelay);
      if (replaceIndex === -1) {
        return;
      }

      selectedIds.delete(chosen[replaceIndex].id);
      selectedTags.delete(chosen[replaceIndex].antiSpamTag);
      chosen[replaceIndex] = replacement;
      selectedIds.add(replacement.id);
      selectedTags.add(replacement.antiSpamTag);
      delayedCount = chosen.filter((task) => task.requiresDelay).length;
    }
  }

  private pickWeightedTask(filters: {
    category?: SecondaryTaskCategory;
    selectedIds: Set<string>;
    selectedTags: Set<string>;
    completedTodayIds: Set<string>;
    requiresDelay?: boolean;
  }): SecondaryTask | null {
    const now = Date.now();
    const candidates = SECONDARY_TASKS.filter((task) => {
      if (filters.category && task.category !== filters.category) {
        return false;
      }

      if (filters.requiresDelay && !task.requiresDelay) {
        return false;
      }

      if (filters.selectedIds.has(task.id) || filters.selectedTags.has(task.antiSpamTag)) {
        return false;
      }

      if (filters.completedTodayIds.has(task.id)) {
        return false;
      }

      const cooldownUntil = this.persistentState.cooldowns[task.id];
      return !cooldownUntil || cooldownUntil <= now;
    });

    if (candidates.length === 0) {
      return null;
    }

    const weighted = candidates.map((task) => {
      const timesUsed = this.persistentState.timesUsed[task.id] ?? 0;
      const weight = task.noveltyWeight / (1 + timesUsed);
      return { task, weight };
    });

    const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
    let cursor = Math.random() * totalWeight;

    for (const item of weighted) {
      cursor -= item.weight;
      if (cursor <= 0) {
        return item.task;
      }
    }

    return weighted[weighted.length - 1]?.task ?? null;
  }

  private getCompletedTaskIdsToday(): string[] {
    return Object.values(this.persistentState.blocks).flatMap((block) => block.completedTaskIds);
  }

  private toView(task: SecondaryTask, blockState: ImpulseBlockState): SecondaryTaskView {
    const completed = blockState.completedTaskIds.includes(task.id);
    return {
      ...task,
      state: completed ? 'completed' : blockState.completed ? 'disabled' : 'idle',
      xpPreview: completed ? null : this.xpForOrder(blockState.completedTaskIds.length + 1),
      xpAwarded: null,
      disabled: completed || blockState.completed,
      doneLabel: completed ? 'hecho' : null
    };
  }

  private getCurrentBlock(hour: number): ImpulseBlockDefinition | null {
    return IMPULSE_BLOCKS.find((block) => hour >= block.startHour && hour < block.endHour) ?? null;
  }

  private getNextBlock(hour: number): ImpulseBlockDefinition | null {
    return IMPULSE_BLOCKS.find((block) => hour < block.startHour) ?? null;
  }

  private getNextFutureBlock(hour: number): ImpulseBlockDefinition | null {
    return IMPULSE_BLOCKS.find((block) => block.startHour > hour) ?? null;
  }

  private msUntilNextBlock(now: Date, hour: number): number | null {
    const nextBlock = this.getNextBlock(hour);
    return nextBlock ? this.msUntilHour(now, nextBlock.startHour) : null;
  }

  private msUntilHour(now: Date, targetHour: number): number {
    const target = new Date(now);
    target.setHours(targetHour, 0, 0, 0);
    return Math.max(target.getTime() - now.getTime(), 0);
  }

  private xpForOrder(order: number): number {
    switch (order) {
      case 1:
        return 4;
      case 2:
        return 3;
      case 3:
        return 2;
      case 4:
        return 2;
      case 5:
        return 1;
      default:
        return 0;
    }
  }

  private startGlobalCooldown(durationMs: number): void {
    this.globalCooldownUntilState.set(Date.now() + durationMs);
    this.cooldownActiveState.set(true);

    if (this.cooldownTimerId) {
      window.clearTimeout(this.cooldownTimerId);
    }

    this.cooldownTimerId = window.setTimeout(() => {
      this.globalCooldownUntilState.set(0);
      this.cooldownActiveState.set(false);
      this.cooldownTimerId = null;
    }, durationMs);
  }

  private getDateKey(timestamp: number): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private loadState(): SecondaryTaskStorageState {
    if (typeof window === 'undefined') {
      return this.createEmptyState(this.getDateKey(Date.now()));
    }

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) {
        return this.createEmptyState(this.getDateKey(Date.now()));
      }

      const parsed = JSON.parse(raw) as Partial<SecondaryTaskStorageState>;
      return {
        date: typeof parsed.date === 'string' ? parsed.date : this.getDateKey(Date.now()),
        blocks: parsed.blocks ?? {},
        dailyXpEarned: typeof parsed.dailyXpEarned === 'number' ? parsed.dailyXpEarned : 0,
        timesUsed: parsed.timesUsed ?? {},
        cooldowns: parsed.cooldowns ?? {}
      };
    } catch {
      return this.createEmptyState(this.getDateKey(Date.now()));
    }
  }

  private persistState(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(this.storageKey, JSON.stringify(this.persistentState));
  }

  private createEmptyState(date: string): SecondaryTaskStorageState {
    return {
      date,
      blocks: {},
      dailyXpEarned: 0,
      timesUsed: {},
      cooldowns: {}
    };
  }

  private areSnapshotsEqual(a: ImpulseBlockSnapshot, b: ImpulseBlockSnapshot): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }
}
