import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ActionSoundService } from './core/services/action-sound.service';
import { PwaInstallService } from './core/services/pwa-install.service';
import { AppLogoComponent } from './shared/components/app-logo/app-logo.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AppLogoComponent],
  template: `
    <section class="app-splash" *ngIf="showSplash()">
      <app-logo size="lg" variant="centered" [pulse]="true"></app-logo>
      <p>VIRA</p>
    </section>
    <router-outlet></router-outlet>
  `,
  styles: [`
    .app-splash {
      position: fixed;
      inset: 0;
      z-index: 120;
      display: grid;
      align-content: center;
      justify-items: center;
      gap: 0.85rem;
      background:
        linear-gradient(155deg, rgba(245, 158, 11, 0.12) 0%, transparent 32%),
        linear-gradient(205deg, rgba(34, 197, 94, 0.07) 0%, transparent 24%),
        linear-gradient(180deg, #0c1220 0%, #111827 54%, #0f172a 100%);
      animation: splashFade 220ms ease-out;
      pointer-events: none;
    }

    .app-splash p {
      margin: 0;
      color: rgba(249, 250, 251, 0.82);
      font-size: 0.86rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    @keyframes splashFade {
      from {
        opacity: 0;
        transform: translateY(8px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class AppComponent {
  private readonly actionSoundService = inject(ActionSoundService);
  private readonly pwaInstallService = inject(PwaInstallService);
  readonly showSplash = signal(false);

  constructor() {
    this.actionSoundService.initialize();
    this.pwaInstallService.initialize();
    this.bootstrapSplash();
  }

  private bootstrapSplash(): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }

    const splashKey = 'modoAventura.ui.splashSeen';
    if (sessionStorage.getItem(splashKey) === 'true') {
      return;
    }

    sessionStorage.setItem(splashKey, 'true');
    this.showSplash.set(true);
    window.setTimeout(() => this.showSplash.set(false), 260);
  }
}
