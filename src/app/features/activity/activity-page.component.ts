import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import {
  LeaderboardEntry,
  LeaderboardProfile,
  LeaderboardResponse,
  LeaderboardTodayStatus
} from '../../core/models/leaderboard.models';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'app-activity-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppButtonComponent,
    EmptyStateComponent,
    ErrorMessageComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    PageShellComponent
  ],
  templateUrl: './activity-page.component.html',
  styleUrl: './activity-page.component.css'
})
export class ActivityPageComponent implements OnInit {
  private readonly leaderboardService = inject(LeaderboardService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly saveMessage = signal<string | null>(null);
  readonly profile = signal<LeaderboardProfile | null>(null);
  readonly leaderboard = signal<LeaderboardResponse | null>(null);
  readonly form = this.formBuilder.nonNullable.group({
    globalLeaderboardOptIn: [false],
    displayName: ['', [Validators.maxLength(30), Validators.pattern(/^[\p{L}\p{N}_ -]*$/u)]]
  });
  readonly isEnabled = computed(() => this.profile()?.globalLeaderboardOptIn ?? false);
  readonly zoneMessage = computed(() => {
    const zone = this.leaderboard()?.zone ?? [];
    const hasUserAbove = zone.some((entry) => !entry.isCurrentUser && entry.position < (this.leaderboard()?.userRank?.position ?? 0));
    return hasUserAbove ? 'Estás cerca de superar a alguien.' : 'Actúa hoy y tu zona se mueve.';
  });

  constructor() {
    this.form.valueChanges.pipe(debounceTime(100)).subscribe(() => {
      this.saveMessage.set(null);
    });
  }

  ngOnInit(): void {
    this.loadProfileAndLeaderboard();
  }

  statusLabel(status: LeaderboardTodayStatus): string {
    switch (status) {
      case 'COMPLETED_TODAY':
        return 'Completó hoy';
      case 'PENDING_TODAY':
        return 'Pendiente hoy';
      case 'FAILED_TODAY':
        return 'Falló hoy';
      case 'INACTIVE_TODAY':
        return 'Sin actividad hoy';
      case 'PROGRAM_COMPLETED':
        return 'Programa finalizado';
    }
  }

  statusClass(status: LeaderboardTodayStatus): string {
    switch (status) {
      case 'COMPLETED_TODAY':
        return 'status-completed';
      case 'PENDING_TODAY':
        return 'status-pending';
      case 'FAILED_TODAY':
        return 'status-failed';
      case 'INACTIVE_TODAY':
        return 'status-inactive';
      case 'PROGRAM_COMPLETED':
        return 'status-finished';
    }
  }

  impulseLine(entry: LeaderboardEntry): string {
    return `Racha ${entry.currentStreak} · ${entry.impulseBlocksCompletedToday} bloques hoy · ${entry.impulseActionsCompletedToday} acciones impulso`;
  }

  saveProfile(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    this.saving.set(true);
    this.errorMessage.set(null);
    this.saveMessage.set(null);

    this.leaderboardService
      .updateMyLeaderboardProfile({
        globalLeaderboardOptIn: raw.globalLeaderboardOptIn,
        displayName: raw.displayName.trim() ? raw.displayName.trim() : null
      })
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.form.patchValue(
            {
              globalLeaderboardOptIn: profile.globalLeaderboardOptIn,
              displayName: profile.displayName ?? ''
            },
            { emitEvent: false }
          );
          this.form.markAsPristine();
          this.saveMessage.set('Cambios guardados');

          if (profile.globalLeaderboardOptIn) {
            this.loadLeaderboardOnly();
            return;
          }

          this.leaderboard.set(null);
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.saving.set(false);
        },
        complete: () => this.saving.set(false)
      });
  }

  trackByPosition(_: number, entry: LeaderboardEntry): number {
    return entry.position;
  }

  private loadProfileAndLeaderboard(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.leaderboardService.getMyLeaderboardProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.form.patchValue(
          {
            globalLeaderboardOptIn: profile.globalLeaderboardOptIn,
            displayName: profile.displayName ?? ''
          },
          { emitEvent: false }
        );
        this.form.markAsPristine();

        if (!profile.globalLeaderboardOptIn) {
          this.leaderboard.set(null);
          return;
        }

        this.loadLeaderboardOnly();
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
      },
      complete: () => this.loading.set(false)
    });
  }

  private loadLeaderboardOnly(): void {
    this.leaderboardService.getGlobalLeaderboard().subscribe({
      next: (leaderboard) => {
        this.leaderboard.set(leaderboard);
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
      }
    });
  }
}
