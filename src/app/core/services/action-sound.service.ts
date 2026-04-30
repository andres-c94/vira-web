import { Injectable, signal } from '@angular/core';

type SoundKind = 'tap' | 'xp' | 'blocked';

@Injectable({ providedIn: 'root' })
export class ActionSoundService {
  private readonly storageKey = 'modoAventura.actionSoundEnabled';
  private audioContext: AudioContext | null = null;
  private unlocked = false;
  private activeVoices = 0;
  private readonly maxConcurrentVoices = 3;

  readonly enabled = signal(this.readEnabledPreference());

  initialize(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.ensureContext();
    this.bindUnlockListeners();
  }

  setEnabled(enabled: boolean): void {
    this.enabled.set(enabled);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(this.storageKey, JSON.stringify(enabled));
    }
  }

  playTap(): void {
    this.play('tap');
  }

  playXP(): void {
    this.play('xp');
  }

  playBlocked(): void {
    this.play('blocked');
  }

  private play(kind: SoundKind): void {
    if (!this.enabled() || !this.unlocked || !this.audioContext || this.activeVoices >= this.maxConcurrentVoices) {
      return;
    }

    try {
      const audioContext = this.audioContext;
      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filterNode = audioContext.createBiquadFilter();

      const config = this.soundConfig(kind);

      filterNode.type = 'lowpass';
      filterNode.frequency.value = config.filter;

      oscillator.type = config.wave;
      oscillator.frequency.setValueAtTime(config.frequency, now);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(config.volume, now + config.attack);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);

      oscillator.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(now);
      oscillator.stop(now + config.duration + 0.02);

      this.activeVoices += 1;
      oscillator.onended = () => {
        this.activeVoices = Math.max(0, this.activeVoices - 1);
        oscillator.disconnect();
        filterNode.disconnect();
        gainNode.disconnect();
      };
    } catch {
      return;
    }
  }

  private soundConfig(kind: SoundKind): {
    frequency: number;
    duration: number;
    attack: number;
    volume: number;
    filter: number;
    wave: OscillatorType;
  } {
    switch (kind) {
      case 'xp':
        return {
          frequency: 880,
          duration: 0.12,
          attack: 0.012,
          volume: 0.035,
          filter: 2400,
          wave: 'triangle'
        };
      case 'blocked':
        return {
          frequency: 340,
          duration: 0.06,
          attack: 0.006,
          volume: 0.022,
          filter: 1200,
          wave: 'sine'
        };
      case 'tap':
      default:
        return {
          frequency: 620,
          duration: 0.08,
          attack: 0.008,
          volume: 0.03,
          filter: 1800,
          wave: 'triangle'
        };
    }
  }

  private ensureContext(): void {
    if (this.audioContext || typeof window === 'undefined') {
      return;
    }

    const ContextConstructor = window.AudioContext ?? (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!ContextConstructor) {
      return;
    }

    try {
      this.audioContext = new ContextConstructor();
    } catch {
      this.audioContext = null;
    }
  }

  private bindUnlockListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const unlock = () => {
      this.ensureContext();

      if (!this.audioContext) {
        cleanup();
        return;
      }

      void this.audioContext.resume().then(() => {
        this.unlocked = true;
        cleanup();
      }).catch(() => {
        cleanup();
      });
    };

    const cleanup = () => {
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
      window.removeEventListener('touchstart', unlock, true);
    };

    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('keydown', unlock, true);
    window.addEventListener('touchstart', unlock, true);
  }

  private readEnabledPreference(): boolean {
    if (typeof window === 'undefined') {
      return true;
    }

    const raw = window.localStorage.getItem(this.storageKey);
    if (raw === null) {
      return true;
    }

    try {
      return JSON.parse(raw) !== false;
    } catch {
      return true;
    }
  }
}
