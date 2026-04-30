import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { PwaInstallService } from '../../../core/services/pwa-install.service';

@Component({
  selector: 'app-install-app-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './install-app-banner.component.html',
  styleUrl: './install-app-banner.component.css'
})
export class InstallAppBannerComponent {
  private readonly pwaInstallService = inject(PwaInstallService);
  readonly hidden = signal(false);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly visible = computed(() => !this.hidden() && this.pwaInstallService.shouldShowBanner());
  readonly copy = this.pwaInstallService.bannerCopy;
  readonly iosStepsVisible = this.pwaInstallService.iosStepsVisible;

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.pwaInstallService.markShown();
      } else {
        this.pwaInstallService.hideIosSteps();
        this.errorMessage.set(null);
      }
    });
  }

  async install(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const result = await this.pwaInstallService.promptInstall();
      if (result === 'unavailable') {
        this.errorMessage.set('La instalación no está disponible en este navegador.');
      } else if (result === 'accepted' || result === 'dismissed') {
        this.hidden.set(true);
      }
    } finally {
      this.loading.set(false);
    }
  }

  dismiss(): void {
    this.hidden.set(true);
    this.pwaInstallService.dismiss();
  }
}
