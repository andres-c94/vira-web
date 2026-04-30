import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ActionSoundService } from '../../core/services/action-sound.service';
import { SuggestionsService } from '../../core/services/suggestions.service';
import { UserService } from '../../core/services/user.service';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ErrorMessageComponent, PageHeaderComponent, PageShellComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly actionSoundService = inject(ActionSoundService);
  private readonly suggestionsService = inject(SuggestionsService);
  readonly loadingTimezone = signal(false);
  readonly loadingReminders = signal(false);
  readonly timezoneSaved = signal(false);
  readonly reminderSaved = signal(false);
  readonly soundSaved = signal(false);
  readonly timezoneError = signal<string | null>(null);
  readonly reminderError = signal<string | null>(null);
  readonly timezoneForm = this.formBuilder.nonNullable.group({
    timezone: [this.authService.user()?.timezone ?? 'America/Bogota', [Validators.required]]
  });
  readonly reminderForm = this.formBuilder.nonNullable.group({
    reminderEnabled: [this.authService.user()?.reminderEnabled ?? false],
    reminderTime: [this.authService.user()?.reminderTime ?? '08:00']
  });
  readonly soundForm = this.formBuilder.nonNullable.group({
    actionSoundEnabled: [this.actionSoundService.enabled()]
  });

  constructor() {
    this.timezoneForm.valueChanges.pipe(debounceTime(100)).subscribe(() => {
      this.timezoneSaved.set(false);
    });

    this.reminderForm.valueChanges.pipe(debounceTime(100)).subscribe(() => {
      this.reminderSaved.set(false);
    });

    this.soundForm.valueChanges.pipe(debounceTime(100)).subscribe(() => {
      this.soundSaved.set(false);
    });
  }

  humanTimezone(): string {
    const timezone = this.timezoneForm.getRawValue().timezone;

    if (timezone === 'America/Bogota') {
      return 'Bogotá (GMT-5)';
    }

    return timezone;
  }

  saveTimezone(): void {
    if (this.timezoneForm.invalid) {
      this.timezoneForm.markAllAsTouched();
      return;
    }

    this.loadingTimezone.set(true);
    this.timezoneError.set(null);
    this.timezoneSaved.set(false);

    this.userService.updateTimezone(this.timezoneForm.getRawValue()).subscribe({
      next: (user) => {
        this.authService.setCurrentUser(user);
        this.timezoneForm.markAsPristine();
        this.timezoneSaved.set(true);
      },
      error: (error: Error) => {
        this.timezoneError.set(error.message);
        this.loadingTimezone.set(false);
      },
      complete: () => this.loadingTimezone.set(false)
    });
  }

  saveReminders(): void {
    const raw = this.reminderForm.getRawValue();

    if (raw.reminderEnabled && !/^\d{2}:\d{2}$/.test(raw.reminderTime)) {
      this.reminderError.set('Usa formato HH:mm.');
      return;
    }

    this.loadingReminders.set(true);
    this.reminderError.set(null);
    this.reminderSaved.set(false);

    this.userService
      .updateReminderSettings({
        reminderEnabled: raw.reminderEnabled,
        reminderTime: raw.reminderEnabled ? raw.reminderTime : null
      })
      .subscribe({
        next: (user) => {
          this.authService.setCurrentUser(user);
          this.reminderForm.markAsPristine();
          this.reminderSaved.set(true);
        },
        error: (error: Error) => {
          this.reminderError.set(error.message);
          this.loadingReminders.set(false);
        },
        complete: () => this.loadingReminders.set(false)
      });
  }

  saveSoundSettings(): void {
    const enabled = this.soundForm.getRawValue().actionSoundEnabled;
    this.actionSoundService.setEnabled(enabled);
    this.soundForm.markAsPristine();
    this.soundSaved.set(true);
  }

  openSuggestions(): void {
    this.suggestionsService.openModal();
  }
}
