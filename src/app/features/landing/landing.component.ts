import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AppLogoComponent } from '../../shared/components/app-logo/app-logo.component';
import { AppButtonComponent } from '../../shared/components/app-button/app-button.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppLogoComponent, AppButtonComponent, ErrorMessageComponent, PageShellComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {
  @ViewChild('authPanel') private authPanel?: ElementRef<HTMLElement>;
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly authMode = signal<'login' | 'register'>('register');
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Bogota';

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  readonly registerForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  constructor() {
    this.route.data
      .pipe(map((data) => (data['authMode'] === 'login' ? 'login' : 'register') as 'login' | 'register'))
      .subscribe((mode) => this.authMode.set(mode));
  }

  switchMode(mode: 'login' | 'register'): void {
    this.errorMessage.set(null);
    void this.router.navigate([mode === 'login' ? '/login' : '/register']);
  }

  openAuth(mode: 'login' | 'register'): void {
    this.switchMode(mode);
    requestAnimationFrame(() => {
      this.authPanel?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  }

  submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: () => void this.router.navigate(['/dashboard']),
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }

  submitRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService
      .register({ ...this.registerForm.getRawValue(), timezone: this.timezone })
      .subscribe({
        next: () => void this.router.navigate(['/programs']),
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.loading.set(false);
        },
        complete: () => this.loading.set(false)
      });
  }
}
