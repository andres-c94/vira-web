import { Mood } from '../../core/models/mission.models';

export function moodLabel(value: Mood): string {
  const labels: Record<Mood, string> = {
    BAD: 'Mal',
    NORMAL: 'Normal',
    GOOD: 'Bien'
  };

  return labels[value];
}
