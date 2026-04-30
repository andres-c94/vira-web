import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PageShellComponent } from '../../../shared/components/page-shell/page-shell.component';

function detectTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Bogota';
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    AppButtonComponent,
    ErrorMessageComponent,
    PageHeaderComponent,
    PageShellComponent
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly timezone = detectTimezone();
  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService
      .register({ ...this.form.getRawValue(), timezone: this.timezone })
      .subscribe({
        next: () => {
          void this.router.navigate(['/programs']);
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.loading.set(false);
        },
        complete: () => this.loading.set(false)
      });
  }
}
