import { CommonModule } from '@angular/common';
import {
  animate,
  keyframes,
  query,
  stagger,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { AnimationEvent } from '@angular/animations';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ImpulseAction, ImpulseTodayResponse } from '../../../core/models/impulse.models';
import { ActionSoundService } from '../../../core/services/action-sound.service';
import { HapticsService } from '../../../core/services/haptics.service';
import { ImpulseService } from '../../../core/services/impulse.service';
import { PwaInstallService } from '../../../core/services/pwa-install.service';

@Component({
  selector: 'app-impulse-block',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './impulse-block.component.html',
  styleUrl: './impulse-block.component.css',
  animations: [
    trigger('chipState', [
      state('AVAILABLE', style({ opacity: 1, filter: 'blur(0px)', transform: 'translateY(0) scale(1)' })),
      state(
        'COMPLETING',
        style({ opacity: 0.94, filter: 'blur(0px)', transform: 'translateY(-2px) scale(1.03)' })
      ),
      state(
        'COMPLETED',
        style({
          opacity: 0.45,
          filter: 'blur(1px)',
          transform: 'translateY(0) scale(1)',
          textDecoration: 'line-through'
        })
      ),
      transition('* => COMPLETING', [
        animate(
          '360ms ease-out',
          keyframes([
            style({ opacity: 1, transform: 'translateY(0) scale(1)', offset: 0 }),
            style({ opacity: 0.98, transform: 'translateY(-1px) scale(1.02)', offset: 0.6 }),
            style({ opacity: 0.94, transform: 'translateY(-2px) scale(1.03)', offset: 1 })
          ])
        )
      ]),
      transition('* => COMPLETED', [animate('260ms ease-out')])
    ]),
    trigger('xpPop', [
      transition('* => COMPLETED', [
        style({ opacity: 0, transform: 'translateY(10px) scale(0.96)' }),
        animate(
          '420ms 140ms ease-out',
          keyframes([
            style({ opacity: 0, transform: 'translateY(10px) scale(0.96)', offset: 0 }),
            style({ opacity: 1, transform: 'translateY(-8px) scale(1.04)', offset: 0.5 }),
            style({ opacity: 0, transform: 'translateY(-18px) scale(1)', offset: 1 })
          ])
        )
      ])
    ]),
    trigger('chipList', [
      transition('* => *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(8px) scale(0.98)' }),
            stagger(35, [animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))])
          ],
          { optional: true }
        )
      ])
    ]),
    trigger('blockedCue', [
      transition('* => *', [
        animate(
          '240ms ease-out',
          keyframes([
            style({ opacity: 0, transform: 'translateY(4px) scale(0.98)', offset: 0 }),
            style({ opacity: 1, transform: 'translateY(0) scale(1)', offset: 0.45 }),
            style({ opacity: 0, transform: 'translateY(-4px) scale(1)', offset: 1 })
          ])
        )
      ])
    ])
  ]
})
export class ImpulseBlockComponent implements OnInit, OnDestroy {
  private readonly impulseService = inject(ImpulseService);
  private readonly actionSoundService = inject(ActionSoundService);
  private readonly hapticsService = inject(HapticsService);
  private readonly pwaInstallService = inject(PwaInstallService);
  private tickTimer: number | null = null;
  private refreshTimer: number | null = null;

  readonly loading = signal(true);
  readonly response = signal<ImpulseTodayResponse | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly blockedFeedbackTick = signal(0);
  readonly blockedFeedbackVisible = signal(false);
  readonly cooldownActive = signal(false);
  readonly cooldownMessage = signal('Espera un momento');
  readonly currentTimestamp = signal(Date.now());
  readonly completingActionId = signal<string | null>(null);

  readonly currentBlock = computed(() => this.response()?.currentBlock ?? null);
  readonly actions = computed(() => this.currentBlock()?.actions ?? []);
  readonly status = computed(() => this.response()?.status ?? 'BETWEEN_BLOCKS');
  readonly canShowTasks = computed(
    () => this.status() === 'ACTIVE_BLOCK' || this.status() === 'BLOCK_COMPLETED'
  );
  readonly statusPill = computed(() => {
    const currentBlock = this.currentBlock();
    switch (this.status()) {
      case 'ACTIVE_BLOCK':
        return currentBlock ? `${currentBlock.label} · +${currentBlock.xpEarned}/${currentBlock.xpMax} XP` : 'Modo impulso';
      case 'BLOCK_COMPLETED':
        return 'Bloque completado';
      case 'ALL_DONE':
        return 'Impulso completado por hoy';
      case 'BETWEEN_BLOCKS':
        return this.nextBlockLabel();
      default:
        return 'Modo impulso';
    }
  });
  readonly dailyLabel = computed(() => {
    const daily = this.response()?.daily;
    return daily ? `Hoy: +${daily.xpEarned}/${daily.xpMax} XP` : null;
  });
  readonly countdownLabel = computed(() => {
    switch (this.status()) {
      case 'BLOCK_COMPLETED':
        return `Nuevo impulso en ${this.formatCountdown(this.countdownMs())}`;
      case 'BETWEEN_BLOCKS':
        return `Siguiente impulso en ${this.formatCountdown(this.countdownMs())}`;
      case 'ALL_DONE':
        return 'Vuelve manana.';
      default:
        return this.dailyLabel();
    }
  });
  readonly completedCountLabel = computed(() => {
    const block = this.currentBlock();
    return block ? `${block.completedCount}/${block.tasksMax} acciones del bloque` : null;
  });

  ngOnInit(): void {
    this.loadImpulse();
    this.tickTimer = window.setInterval(() => {
      this.currentTimestamp.set(Date.now());
      const countdownMs = this.countdownMs();
      if (countdownMs !== null && countdownMs <= 0) {
        this.loadImpulse();
      }
    }, 1000);
    this.refreshTimer = window.setInterval(() => this.loadImpulse(false), 60000);
  }

  ngOnDestroy(): void {
    if (this.tickTimer) {
      window.clearInterval(this.tickTimer);
    }

    if (this.refreshTimer) {
      window.clearInterval(this.refreshTimer);
    }
  }

  bubbleVariant(action: ImpulseAction, index: number): string {
    const size = index % 3 === 0 ? 'bubble-large' : index % 3 === 1 ? 'bubble-medium' : 'bubble-compact';
    return `${size} bubble-${action.category}`;
  }

  onActionClick(action: ImpulseAction): void {
    if (this.status() !== 'ACTIVE_BLOCK') {
      return;
    }

    if (this.cooldownActive()) {
      this.actionSoundService.playBlocked();
      this.hapticsService.blocked();
      this.blockedFeedbackVisible.set(true);
      this.blockedFeedbackTick.update((value) => value + 1);
      return;
    }

    if (action.status === 'COMPLETED' || this.completingActionId()) {
      return;
    }

    this.completingActionId.set(action.id);
  }

  onAnimationDone(event: AnimationEvent, action: ImpulseAction): void {
    if (event.toState !== 'COMPLETING') {
      return;
    }

    const payload = this.buildTimePayload();
    this.actionSoundService.playTap();
    this.hapticsService.light();
    this.impulseService.completeAction(action.id, payload).subscribe({
      next: (response) => {
        this.response.set(response);
        this.currentTimestamp.set(Date.now());
        this.pwaInstallService.markImpulseCompleted();
        this.startCooldown();
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
      },
      complete: () => this.completingActionId.set(null)
    });
  }

  onXpPopStart(): void {
    this.actionSoundService.playXP();
  }

  onBlockedFeedbackDone(): void {
    this.blockedFeedbackVisible.set(false);
  }

  trackByActionId(_: number, action: ImpulseAction): string {
    return action.id;
  }

  previewXp(action: ImpulseAction): number {
    if (action.status === 'COMPLETED') {
      return action.xpEarned;
    }

    const completedCount = this.currentBlock()?.completedCount ?? 0;
    return [4, 3, 2, 2, 1][completedCount] ?? 0;
  }

  chipState(action: ImpulseAction): 'AVAILABLE' | 'COMPLETING' | 'COMPLETED' {
    if (this.completingActionId() === action.id) {
      return 'COMPLETING';
    }

    return action.status === 'COMPLETED' ? 'COMPLETED' : 'AVAILABLE';
  }

  countdownMs(): number | null {
    const nextBlock = this.response()?.nextBlock;
    if (!nextBlock) {
      return null;
    }

    const target = new Date();
    const [hours, minutes] = nextBlock.startTime.split(':').map((value) => Number(value));
    target.setHours(hours, minutes, 0, 0);
    return Math.max(target.getTime() - this.currentTimestamp(), 0);
  }

  formatCountdown(ms: number | null): string {
    if (ms === null) {
      return '00:00:00';
    }

    const totalSeconds = Math.max(Math.ceil(ms / 1000), 0);
    const hours = `${Math.floor(totalSeconds / 3600)}`.padStart(2, '0');
    const minutes = `${Math.floor((totalSeconds % 3600) / 60)}`.padStart(2, '0');
    const seconds = `${totalSeconds % 60}`.padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  private nextBlockLabel(): string {
    const nextBlock = this.response()?.nextBlock;
    return nextBlock ? `Impulso ${nextBlock.blockIndex}/4` : 'Modo impulso';
  }

  private loadImpulse(showLoading = true): void {
    if (showLoading) {
      this.loading.set(true);
    }

    const payload = this.buildTimePayload();
    this.impulseService.getTodayImpulse(payload.localDate, payload.currentTime).subscribe({
      next: (response) => {
        this.response.set(response);
        this.errorMessage.set(null);
        this.currentTimestamp.set(Date.now());
      },
      error: (error: Error) => this.errorMessage.set(error.message),
      complete: () => this.loading.set(false)
    });
  }

  private buildTimePayload() {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    const hours = `${now.getHours()}`.padStart(2, '0');
    const minutes = `${now.getMinutes()}`.padStart(2, '0');

    return {
      localDate: `${year}-${month}-${day}`,
      currentTime: `${hours}:${minutes}`
    };
  }

  private startCooldown(): void {
    this.cooldownActive.set(true);
    window.setTimeout(() => this.cooldownActive.set(false), 1200);
  }
}
