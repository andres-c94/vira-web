import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HapticsService {
  light(): void {
    this.vibrate(10);
  }

  success(): void {
    this.vibrate([10, 30, 10]);
  }

  blocked(): void {
    this.vibrate(20);
  }

  private vibrate(pattern: number | number[]): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }
}
