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
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { SecondaryTaskView } from '../../core/models/secondary-task.models';
import { ActionSoundService } from '../../core/services/action-sound.service';
import { SecondaryTaskService } from '../../core/services/secondary-task.service';

@Component({
  selector: 'app-secondary-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './secondary-actions.component.html',
  styleUrl: './secondary-actions.component.css',
  animations: [
    trigger('chipState', [
      state(
        'idle',
        style({
          opacity: 1,
          filter: 'blur(0px)',
          transform: 'translateY(0) scale(1)'
        })
      ),
      state(
        'completing',
        style({
          opacity: 0.94,
          filter: 'blur(0px)',
          transform: 'translateY(-2px) scale(1.03)'
        })
      ),
      state(
        'completed',
        style({
          opacity: 0.46,
          filter: 'blur(1px)',
          transform: 'translateY(0) scale(1)',
          textDecoration: 'line-through'
        })
      ),
      state(
        'disabled',
        style({
          opacity: 0.46,
          filter: 'blur(0px)',
          transform: 'translateY(0) scale(1)'
        })
      ),
      transition('* => completing', [
        animate(
          '360ms ease-out',
          keyframes([
            style({ opacity: 1, transform: 'translateY(0) scale(1)', offset: 0 }),
            style({ opacity: 0.98, transform: 'translateY(-1px) scale(1.02)', offset: 0.6 }),
            style({ opacity: 0.94, transform: 'translateY(-2px) scale(1.03)', offset: 1 })
          ])
        )
      ]),
      transition('* => completed', [animate('260ms ease-out')]),
      transition('* => disabled', [animate('220ms ease-out')])
    ]),
    trigger('xpPop', [
      transition('* => completed', [
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
    trigger('meterPulse', [
      transition('* => *', [
        query(
          '.secondary-actions__meter-fill',
          [
            animate(
              '520ms ease-out',
              keyframes([
                style({ boxShadow: '0 0 0 rgba(245, 158, 11, 0)', offset: 0 }),
                style({ boxShadow: '0 0 14px rgba(245, 158, 11, 0.24)', offset: 0.45 }),
                style({ boxShadow: '0 0 0 rgba(245, 158, 11, 0)', offset: 1 })
              ])
            )
          ],
          { optional: true }
        )
      ])
    ]),
    trigger('counterPulse', [
      transition('* => *', [
        animate(
          '420ms ease-out',
          keyframes([
            style({ opacity: 0.7, transform: 'translateY(0)', offset: 0 }),
            style({ opacity: 1, transform: 'translateY(-1px)', offset: 0.45 }),
            style({ opacity: 0.82, transform: 'translateY(0)', offset: 1 })
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
    ]),
    trigger('cooldownNudge', [
      transition('* => *', [
        animate(
          '220ms ease-out',
          keyframes([
            style({ transform: 'scale(1)', offset: 0 }),
            style({ transform: 'scale(0.98)', offset: 0.45 }),
            style({ transform: 'scale(1)', offset: 1 })
          ])
        )
      ])
    ])
  ]
})
export class SecondaryActionsComponent implements OnInit {
  private readonly secondaryTaskService = inject(SecondaryTaskService);
  private readonly actionSoundService = inject(ActionSoundService);

  readonly tasks = this.secondaryTaskService.visibleTasks;
  readonly mode = this.secondaryTaskService.mode;
  readonly currentBlock = this.secondaryTaskService.currentBlock;
  readonly nextBlock = this.secondaryTaskService.nextBlock;
  readonly countdownMs = this.secondaryTaskService.countdownMs;
  readonly blockXp = this.secondaryTaskService.blockXp;
  readonly todayXp = this.secondaryTaskService.todayXp;
  readonly completedCount = this.secondaryTaskService.completedCount;
  readonly cooldownActive = this.secondaryTaskService.cooldownActive;
  readonly blockedFeedbackTick = signal(0);
  readonly blockedFeedbackVisible = signal(false);
  readonly transientCueText = signal('Espera un momento');
  readonly cooldownNudgeTick = signal(0);
  readonly canShowTasks = computed(() => this.mode() === 'active' || this.mode() === 'block-complete');
  readonly statusPill = computed(() => {
    const mode = this.mode();
    const block = this.currentBlock();

    if (mode === 'active' && block) {
      return `${block.label} · +${this.blockXp()}/12 XP`;
    }

    if (mode === 'block-complete') {
      return 'Bloque completado';
    }

    if (mode === 'day-complete') {
      return 'Impulso completado por hoy';
    }

    return this.nextBlock()?.label ?? 'Modo impulso';
  });
  readonly countdownLabel = computed(() => {
    const mode = this.mode();

    if (mode === 'block-complete') {
      return `Nuevo impulso en ${this.formatCountdown(this.countdownMs())}`;
    }

    if (mode === 'locked') {
      return `Siguiente impulso en ${this.formatCountdown(this.countdownMs())}`;
    }

    if (mode === 'day-complete') {
      return 'Vuelve manana.';
    }

    return `Hoy: +${this.todayXp()}/48 XP`;
  });

  ngOnInit(): void {
    this.secondaryTaskService.prepareTasks();
  }

  onClick(event: MouseEvent, task: SecondaryTaskView): void {
    this.secondaryTaskService.touchActivity();
    event.preventDefault();

    const outcome = this.secondaryTaskService.requestCompletion(task.id);
    if (outcome === 'started') {
      this.actionSoundService.playTap();
      return;
    }

    if (outcome === 'cooldown') {
      this.onCooldownBlocked();
    }
  }

  onCooldownBlocked(): void {
    if (!this.cooldownActive()) {
      return;
    }

    this.actionSoundService.playBlocked();
    this.transientCueText.set('Espera un momento');
    this.blockedFeedbackVisible.set(true);
    this.blockedFeedbackTick.update((value) => value + 1);
    this.cooldownNudgeTick.update((value) => value + 1);
  }

  onBlockedFeedbackDone(): void {
    this.blockedFeedbackVisible.set(false);
  }

  onChipAnimationDone(event: AnimationEvent, task: SecondaryTaskView): void {
    if (event.toState === 'completing') {
      this.secondaryTaskService.finalizeCompletion(task.id);
    }
  }

  onXpPopStart(): void {
    this.actionSoundService.playXP();
  }

  trackByTaskId(_: number, task: SecondaryTaskView): string {
    return task.id;
  }

  bubbleVariant(task: SecondaryTaskView, index: number): string {
    const size = index % 3 === 0 ? 'bubble-large' : index % 3 === 1 ? 'bubble-medium' : 'bubble-compact';
    return `${size} bubble-${task.category}`;
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
}
