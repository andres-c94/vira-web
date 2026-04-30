import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ProgramMission } from '../../../core/models/program.models';
import { difficultyLabel } from '../../utils/difficulty-label.util';
import { AppButtonComponent } from '../app-button/app-button.component';

@Component({
  selector: 'app-mission-card',
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  templateUrl: './mission-card.component.html',
  styleUrl: './mission-card.component.css'
})
export class MissionCardComponent {
  readonly mission = input.required<ProgramMission>();
  readonly status = input<'PENDING' | 'COMPLETED' | 'FAILED'>('PENDING');
  readonly complete = output<void>();
  readonly fail = output<void>();
  readonly view = output<void>();

  difficultyLabel = difficultyLabel;
}
