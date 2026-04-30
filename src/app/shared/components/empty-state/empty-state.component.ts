import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { AppButtonComponent } from '../app-button/app-button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css'
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly actionLabel = input<string>('');
  readonly action = output<void>();
}
