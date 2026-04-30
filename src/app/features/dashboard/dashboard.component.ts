import { CommonModule } from '@angular/common';
import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardResponse } from '../../core/models/dashboard.models';
import { ProgramMission } from '../../core/models/program.models';
import { DashboardService } from '../../core/services/dashboard.service';
import { PwaInstallService } from '../../core/services/pwa-install.service';
import { ProgramService } from '../../core/services/program.service';
import { SuggestionsService } from '../../core/services/suggestions.service';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { InstallAppBannerComponent } from '../../shared/components/install-app-banner/install-app-banner.component';
import { ImpulseBlockComponent } from '../../shared/components/impulse-block/impulse-block.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    AppButtonComponent,
    EmptyStateComponent,
    ErrorMessageComponent,
    InstallAppBannerComponent,
    ImpulseBlockComponent,
    LoadingStateComponent,
    PageShellComponent,
    ProgressBarComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  animations: [
    trigger('missionState', [
      state('PENDING', style({ opacity: 1, transform: 'translateY(0)' })),
      state('COMPLETED', style({ opacity: 1, transform: 'translateY(0)' })),
      state('FAILED', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('* => COMPLETED', [
        style({ opacity: 0.72, transform: 'translateY(10px)' }),
        animate('260ms ease-out')
      ])
    ]),
    trigger('rewardPop', [
      transition(':enter', [
        animate(
          '420ms ease-out',
          keyframes([
            style({ opacity: 0, transform: 'translateY(10px) scale(0.95)', offset: 0 }),
            style({ opacity: 1, transform: 'translateY(-4px) scale(1.05)', offset: 0.62 }),
            style({ opacity: 1, transform: 'translateY(0) scale(1)', offset: 1 })
          ])
        )
      ])
    ]),
    trigger('streakPulse', [
      transition('* => *', [
        animate(
          '400ms ease-out',
          keyframes([
            style({ opacity: 0.76, transform: 'scale(1)', offset: 0 }),
            style({ opacity: 1, transform: 'scale(1.015)', offset: 0.45 }),
            style({ opacity: 0.78, transform: 'scale(1)', offset: 1 })
          ])
        )
      ])
    ])
  ]
})
export class DashboardComponent implements OnInit {
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly dashboard = signal<DashboardResponse | null>(null);
  readonly nextMission = signal<ProgramMission | null>(null);

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly programService: ProgramService,
    private readonly pwaInstallService: PwaInstallService,
    private readonly router: Router,
    private readonly suggestionService: SuggestionsService
  ) {}

  ngOnInit(): void {
    this.pwaInstallService.trackDashboardVisit();
    this.loadDashboard();
  }

  goToPrograms(): void {
    void this.router.navigate(['/programs']);
  }

  goToMission(): void {
    void this.router.navigate(['/mission']);
  }

  goToCompleteMission(): void {
    void this.router.navigate(['/mission/complete']);
  }

  goToFailMission(): void {
    void this.router.navigate(['/mission/fail']);
  }

  goToProgress(): void {
    void this.router.navigate(['/progress']);
  }

  openSuggestions(): void {
    this.suggestionService.openModal();
  }

  ritualLine(data: DashboardResponse): string {
    if (data.programStatus === 'COMPLETED') {
      return 'Reto terminado.';
    }

    if (data.missionExecutionStatus === 'COMPLETED') {
      return 'Hoy ya está cerrado.';
    }

    if (data.missionExecutionStatus === 'FAILED') {
      return 'Mañana se vuelve al campo.';
    }

    return 'Hoy toca ejecutar.';
  }

  private loadDashboard(): void {
    this.dashboardService.getToday().subscribe({
      next: (response) => {
        this.dashboard.set(response);
        if (response.programStatus === 'ACTIVE' && response.missionExecutionStatus === 'COMPLETED') {
          this.pwaInstallService.markMissionCompleted();
        }
        this.loadNextMissionPreview(response);
      },
      error: (error: Error) => this.errorMessage.set(error.message),
      complete: () => this.loading.set(false)
    });
  }

  private loadNextMissionPreview(data: DashboardResponse): void {
    this.nextMission.set(null);

    if (
      data.programStatus !== 'ACTIVE' ||
      data.missionExecutionStatus !== 'COMPLETED' ||
      !data.program?.id ||
      !data.programDay ||
      data.programDay >= data.program.totalDays
    ) {
      return;
    }

    this.programService.getProgramMissions(data.program.id).subscribe({
      next: (missions) => {
        const mission = missions.find((item) => item.dayNumber === data.programDay! + 1) ?? null;
        this.nextMission.set(mission);
      },
      error: () => this.nextMission.set(null)
    });
  }
}
