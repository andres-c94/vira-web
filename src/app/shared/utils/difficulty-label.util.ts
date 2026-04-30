export function difficultyLabel(value: 'EASY' | 'MEDIUM' | 'HARD'): string {
  const labels = {
    EASY: 'Baja',
    MEDIUM: 'Media',
    HARD: 'Alta'
  };

  return labels[value];
}
