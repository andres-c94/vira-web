import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-logo.component.html',
  styleUrl: './app-logo.component.css'
})
export class AppLogoComponent {
  // TODO: Derive dedicated 192x192 and 512x512 PWA icons from this logo asset.
  readonly size = input<'sm' | 'md' | 'lg'>('sm');
  readonly variant = input<'default' | 'centered'>('default');
  readonly pulse = input(false);
  readonly classes = computed(() =>
    `logo logo--${this.size()} logo--${this.variant()}${this.pulse() ? ' logo--pulse' : ''}`
  );
}
