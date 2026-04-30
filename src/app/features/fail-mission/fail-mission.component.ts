import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FailMissionPayload, Mood } from '../../core/models/mission.models';
import { MissionService } from '../../core/services/mission.service';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'app-fail-mission',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppButtonComponent, ErrorMessageComponent, PageHeaderComponent, PageShellComponent],
  templateUrl: './fail-mission.component.html',
  styleUrl: './fail-mission.component.css'
})
export class FailMissionComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly missionService = inject(MissionService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly reasons: FailMissionPayload['reason'][] = ['NO_TIME', 'FORGOT', 'NO_MOTIVATION', 'TOO_DIFFICULT', 'OTHER'];
  readonly moods: Array<Mood | ''> = ['', 'BAD', 'NORMAL', 'GOOD'];
  readonly form = this.formBuilder.nonNullable.group({
    reason: ['NO_TIME' as FailMissionPayload['reason'], [Validators.required]],
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
      .failToday({
        reason: raw.reason,
        mood: raw.mood || null
      })
      .subscribe({
        next: () => void this.router.navigate(['/dashboard']),
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.loading.set(false);
        },
        complete: () => this.loading.set(false)
      });
  }
}
