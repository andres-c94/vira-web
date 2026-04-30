import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ProgressSummary } from '../../core/models/progress.models';
import { ProgressService } from '../../core/services/progress.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar.component';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [
    CommonModule,
    EmptyStateComponent,
    ErrorMessageComponent,
    LoadingStateComponent,
    PageShellComponent
    ,ProgressBarComponent
  ],
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.css'
})
export class ProgressComponent implements OnInit {
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly summary = signal<ProgressSummary | null>(null);
  readonly noActiveProgram = signal(false);

  constructor(
    private readonly progressService: ProgressService,
    public readonly router: Router
  ) {}

  ngOnInit(): void {
    this.progressService.getSummary().subscribe({
      next: (summary) => this.summary.set(summary),
      error: (error: Error) => {
        if (error.message === 'No active program') {
          this.noActiveProgram.set(true);
          return;
        }
        this.errorMessage.set(error.message);
      },
      complete: () => this.loading.set(false)
    });
  }
}
