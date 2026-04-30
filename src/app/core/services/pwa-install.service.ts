import { Injectable, computed, signal } from '@angular/core';

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type InstallCopyVariant = 'A' | 'B' | 'C';
type InstallEventType =
  | 'install_prompt_shown'
  | 'install_prompt_clicked'
  | 'install_prompt_accepted'
  | 'install_prompt_dismissed'
  | 'install_prompt_ios_steps_opened'
  | 'appinstalled';

type InstallPlatform = 'android' | 'ios' | 'desktop' | 'unknown';

interface InstallEventRecord {
  type: InstallEventType;
  variant: InstallCopyVariant;
  timestamp: string;
  platform: InstallPlatform;
}

interface InstallBannerCopy {
  title: string;
  text: string;
  primaryLabel: string;
  secondaryLabel: string;
  isIosGuide: boolean;
}

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private readonly dismissedAtKey = 'modoAventura.pwa.dismissedAt';
  private readonly shownAtKey = 'modoAventura.pwa.shownAt';
  private readonly dashboardVisitsKey = 'modoAventura.pwa.dashboardVisits';
  private readonly sessionsKey = 'modoAventura.pwa.sessions';
  private readonly variantKey = 'modoAventura.pwa.installCopyVariant';
  private readonly eventsKey = 'modoAventura.pwa.events';
  private readonly missionCompletedKey = 'modoAventura.pwa.missionCompleted';
  private readonly impulseCompletedKey = 'modoAventura.pwa.impulseCompleted';
  private readonly installedKey = 'modoAventura.pwa.installed';
  private readonly sessionMarkerKey = 'modoAventura.pwa.sessionActive';

  private deferredPrompt: DeferredInstallPrompt | null = null;

  private readonly installAvailableState = signal(false);
  private readonly standaloneState = signal(this.detectStandalone());
  private readonly iosSafariState = signal(this.detectIosSafari());
  private readonly dashboardVisitsState = signal(this.getStoredNumber(this.dashboardVisitsKey));
  private readonly sessionsState = signal(this.bootstrapSessionCount());
  private readonly missionCompletedState = signal(this.getStoredBoolean(this.missionCompletedKey));
  private readonly impulseCompletedState = signal(this.getStoredBoolean(this.impulseCompletedKey));
  private readonly copyVariantState = signal<InstallCopyVariant>(this.bootstrapVariant());
  private readonly iosStepsVisibleState = signal(false);

  readonly isStandalone = this.standaloneState.asReadonly();
  readonly isInstallAvailable = this.installAvailableState.asReadonly();
  readonly isIosSafari = this.iosSafariState.asReadonly();
  readonly iosStepsVisible = this.iosStepsVisibleState.asReadonly();
  readonly copyVariant = this.copyVariantState.asReadonly();

  readonly bannerCopy = computed<InstallBannerCopy>(() => {
    if (this.iosSafariState()) {
      return {
        title: 'Añade VIRA a inicio',
        text: 'En Safari: toca Compartir y luego “Agregar a pantalla de inicio”.',
        primaryLabel: 'Ver pasos',
        secondaryLabel: 'Ahora no',
        isIosGuide: true
      };
    }

    switch (this.copyVariantState()) {
      case 'B':
        return {
          title: 'Menos navegador, más acción',
          text: 'Entra directo a tu misión diaria sin distracciones.',
          primaryLabel: 'Instalar app',
          secondaryLabel: 'Ahora no',
          isIosGuide: false
        };
      case 'C':
        return {
          title: 'Llévala contigo',
          text: 'Accede más rápido desde tu pantalla de inicio.',
          primaryLabel: 'Añadir',
          secondaryLabel: 'Ahora no',
          isIosGuide: false
        };
      default:
        return {
          title: 'Instala VIRA',
          text: 'Ábrela como app, sin barra del navegador y con acceso más rápido.',
          primaryLabel: 'Instalar',
          secondaryLabel: 'Ahora no',
          isIosGuide: false
        };
    }
  });

  readonly shouldShowBanner = computed(() => {
    if (this.standaloneState() || this.getStoredBoolean(this.installedKey)) {
      return false;
    }

    if (this.wasDismissedRecently() || this.wasShownToday()) {
      return false;
    }

    if (this.sessionsState() < 2) {
      return false;
    }

    const hasValueSignal =
      this.missionCompletedState() ||
      this.dashboardVisitsState() >= 2 ||
      this.sessionsState() >= 2 ||
      this.impulseCompletedState();

    if (!hasValueSignal) {
      return false;
    }

    return this.iosSafariState() || this.installAvailableState();
  });

  initialize(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.syncBodyClass();
    window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', this.handleAppInstalled);
    window.matchMedia('(display-mode: standalone)').addEventListener('change', this.handleDisplayModeChange);
  }

  trackDashboardVisit(): void {
    const next = this.dashboardVisitsState() + 1;
    this.dashboardVisitsState.set(next);
    localStorage.setItem(this.dashboardVisitsKey, String(next));
  }

  markMissionCompleted(): void {
    this.missionCompletedState.set(true);
    localStorage.setItem(this.missionCompletedKey, 'true');
  }

  markImpulseCompleted(): void {
    this.impulseCompletedState.set(true);
    localStorage.setItem(this.impulseCompletedKey, 'true');
  }

  markShown(): void {
    if (!this.shouldShowBanner() || this.wasShownToday()) {
      return;
    }

    const now = new Date().toISOString();
    localStorage.setItem(this.shownAtKey, now);
    this.trackEvent('install_prompt_shown');
  }

  dismiss(): void {
    localStorage.setItem(this.dismissedAtKey, new Date().toISOString());
    this.trackEvent('install_prompt_dismissed');
  }

  hideIosSteps(): void {
    this.iosStepsVisibleState.set(false);
  }

  async promptInstall(): Promise<'accepted' | 'dismissed' | 'ios' | 'unavailable'> {
    this.trackEvent('install_prompt_clicked');

    if (this.iosSafariState()) {
      this.iosStepsVisibleState.set(true);
      this.trackEvent('install_prompt_ios_steps_opened');
      return 'ios';
    }

    if (!this.deferredPrompt) {
      return 'unavailable';
    }

    await this.deferredPrompt.prompt();

    const choice = await this.deferredPrompt.userChoice?.catch(() => null);
    this.deferredPrompt = null;
    this.installAvailableState.set(false);

    if (choice?.outcome === 'accepted') {
      localStorage.setItem(this.installedKey, 'true');
      this.trackEvent('install_prompt_accepted');
      return 'accepted';
    }

    this.dismiss();
    return 'dismissed';
  }

  trackEvent(type: InstallEventType): void {
    const events = this.getStoredEvents();
    const nextEvent: InstallEventRecord = {
      type,
      variant: this.copyVariantState(),
      timestamp: new Date().toISOString(),
      platform: this.detectPlatform()
    };

    events.push(nextEvent);
    localStorage.setItem(this.eventsKey, JSON.stringify(events));
  }

  private readonly handleBeforeInstallPrompt = (event: Event): void => {
    event.preventDefault();
    this.deferredPrompt = event as DeferredInstallPrompt;
    this.installAvailableState.set(true);
  };

  private readonly handleAppInstalled = (): void => {
    this.deferredPrompt = null;
    this.installAvailableState.set(false);
    this.standaloneState.set(true);
    localStorage.setItem(this.installedKey, 'true');
    this.trackEvent('appinstalled');
    this.syncBodyClass();
  };

  private readonly handleDisplayModeChange = (): void => {
    this.standaloneState.set(this.detectStandalone());
    this.syncBodyClass();
  };

  private detectStandalone(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      ((window.navigator as Navigator & { standalone?: boolean }).standalone === true)
    );
  }

  private detectIosSafari(): boolean {
    if (typeof navigator === 'undefined') {
      return false;
    }

    const userAgent = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(userAgent);
    const isWebkit = /WebKit/.test(userAgent);
    const isCriOS = /CriOS|FxiOS|EdgiOS/.test(userAgent);
    return isIos && isWebkit && !isCriOS;
  }

  private detectPlatform(): InstallPlatform {
    if (this.iosSafariState()) {
      return 'ios';
    }

    if (typeof navigator === 'undefined') {
      return 'unknown';
    }

    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('android')) {
      return 'android';
    }

    if (/mac|win|linux/.test(userAgent)) {
      return 'desktop';
    }

    return 'unknown';
  }

  private syncBodyClass(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('app-standalone', this.standaloneState());
    }
  }

  private wasDismissedRecently(): boolean {
    const raw = this.getStoredString(this.dismissedAtKey);
    if (!raw) {
      return false;
    }

    return Date.now() - new Date(raw).getTime() < 7 * 24 * 60 * 60 * 1000;
  }

  private wasShownToday(): boolean {
    const raw = this.getStoredString(this.shownAtKey);
    if (!raw) {
      return false;
    }

    return this.toLocalDateKey(new Date(raw)) === this.toLocalDateKey(new Date());
  }

  private bootstrapSessionCount(): number {
    if (typeof window === 'undefined') {
      return 1;
    }

    if (sessionStorage.getItem(this.sessionMarkerKey) === 'true') {
      return this.getStoredNumber(this.sessionsKey) || 1;
    }

    const next = (this.getStoredNumber(this.sessionsKey) || 0) + 1;
    localStorage.setItem(this.sessionsKey, String(next));
    sessionStorage.setItem(this.sessionMarkerKey, 'true');
    return next;
  }

  private bootstrapVariant(): InstallCopyVariant {
    const stored = this.getStoredString(this.variantKey);
    if (stored === 'A' || stored === 'B' || stored === 'C') {
      return stored;
    }

    const variants: InstallCopyVariant[] = ['A', 'B', 'C'];
    const variant = variants[Math.floor(Math.random() * variants.length)];
    localStorage.setItem(this.variantKey, variant);
    return variant;
  }

  private getStoredEvents(): InstallEventRecord[] {
    const raw = this.getStoredString(this.eventsKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as InstallEventRecord[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private getStoredString(key: string): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem(key);
  }

  private getStoredNumber(key: string): number {
    const raw = this.getStoredString(key);
    return raw ? Number(raw) || 0 : 0;
  }

  private getStoredBoolean(key: string): boolean {
    return this.getStoredString(key) === 'true';
  }

  private toLocalDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
