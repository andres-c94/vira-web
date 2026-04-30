import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.css'
})
export class ProgressBarComponent {
  readonly value = input.required<number>();
  readonly label = input<string>('');
  readonly clampedValue = computed(() => Math.max(0, Math.min(100, this.value())));
}
