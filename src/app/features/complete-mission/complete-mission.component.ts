import { CommonModule } from '@angular/common';
import { animate, keyframes, style, transition, trigger } from '@angular/animations';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardResponse } from '../../core/models/dashboard.models';
import { MissionService } from '../../core/services/mission.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { HapticsService } from '../../core/services/haptics.service';
import { PwaInstallService } from '../../core/services/pwa-install.service';
import { Mood } from '../../core/models/mission.models';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'app-complete-mission',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppButtonComponent, ErrorMessageComponent, PageHeaderComponent, PageShellComponent],
  templateUrl: './complete-mission.component.html',
  styleUrl: './complete-mission.component.css',
  animations: [
    trigger('statusReveal', [
      transition(':enter', [
        animate(
          '360ms ease-out',
          keyframes([
            style({ opacity: 0, transform: 'translateY(12px) scale(0.98)', offset: 0 }),
            style({ opacity: 1, transform: 'translateY(0) scale(1)', offset: 1 })
          ])
        )
      ])
    ]),
    trigger('xpReveal', [
      transition(':enter', [
        animate(
          '420ms 140ms ease-out',
          keyframes([
            style({ opacity: 0, transform: 'translateY(10px) scale(0.95)', offset: 0 }),
            style({ opacity: 1, transform: 'translateY(-6px) scale(1.04)', offset: 0.55 }),
            style({ opacity: 1, transform: 'translateY(0) scale(1)', offset: 1 })
          ])
        )
      ])
    ]),
    trigger('progressReveal', [
      transition(':enter', [
        animate(
          '420ms 160ms ease-out',
          keyframes([
            style({ opacity: 0, transform: 'translateY(8px)', offset: 0 }),
            style({ opacity: 1, transform: 'translateY(-2px)', offset: 0.5 }),
            style({ opacity: 1, transform: 'translateY(0)', offset: 1 })
          ])
        )
      ])
    ]),
    trigger('streakReveal', [
      transition(':enter', [
        animate(
          '420ms ease-out',
          keyframes([
            style({ opacity: 0.65, transform: 'translateY(6px)', offset: 0 }),
            style({ opacity: 1, transform: 'translateY(-2px)', offset: 0.5 }),
            style({ opacity: 1, transform: 'translateY(0)', offset: 1 })
          ])
        )
      ])
    ])
  ]
})
export class CompleteMissionComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly missionService = inject(MissionService);
  private readonly dashboardService = inject(DashboardService);
  private readonly hapticsService = inject(HapticsService);
  private readonly pwaInstallService = inject(PwaInstallService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly completionSnapshot = signal<DashboardResponse | null>(null);
  readonly completionPhase = signal<'form' | 'status' | 'xp' | 'progress' | 'streak'>('form');
  readonly moods: Array<Mood | ''> = ['', 'BAD', 'NORMAL', 'GOOD'];
  readonly form = this.formBuilder.nonNullable.group({
    durationMinutes: [0, [Validators.required, Validators.min(0)]],
    difficultyRating: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
    socialMediaMinutes: [0, [Validators.required, Validators.min(0)]],
    reflection: ['', [Validators.maxLength(1000)]],
    mood: ['' as Mood | '']
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.loading.set(true);
    this.errorMessage.set(null);

    this.missionService
      .completeToday({
        durationMinutes: raw.durationMinutes,
        difficultyRating: raw.difficultyRating,
        socialMediaMinutes: raw.socialMediaMinutes,
        reflection: raw.reflection || null,
        mood: raw.mood || null
      })
      .subscribe({
        next: () => {
          this.performCompletionHaptic();
          this.pwaInstallService.markMissionCompleted();
          this.loadCompletionSnapshot();
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.loading.set(false);
        },
        complete: () => this.loading.set(false)
      });
  }

  onStatusShown(): void {
    if (this.completionPhase() === 'status') {
      this.completionPhase.set(this.completionSnapshot()?.mission?.xpReward ? 'xp' : 'progress');
    }
  }

  onXpShown(): void {
    if (this.completionPhase() === 'xp') {
      this.completionPhase.set('progress');
    }
  }

  onProgressShown(): void {
    if (this.completionPhase() === 'progress') {
      this.completionPhase.set('streak');
    }
  }

  onStreakShown(): void {
    if (this.completionPhase() === 'streak') {
      void this.router.navigate(['/dashboard']);
    }
  }

  private performCompletionHaptic(): void {
    this.hapticsService.success();
  }

  private loadCompletionSnapshot(): void {
    this.dashboardService.getToday().subscribe({
      next: (snapshot) => {
        this.completionSnapshot.set(snapshot);
        this.completionPhase.set('status');
      },
      error: () => void this.router.navigate(['/dashboard']),
      complete: () => this.loading.set(false)
    });
  }
}
