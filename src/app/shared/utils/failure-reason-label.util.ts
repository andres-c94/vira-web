import { FailureReason } from '../../core/models/mission.models';

export function failureReasonLabel(value: FailureReason): string {
  const labels: Record<FailureReason, string> = {
    SYSTEM_TIMEOUT: 'Se cerró el día',
    NO_TIME: 'No tuve tiempo',
    FORGOT: 'Se me olvidó',
    NO_MOTIVATION: 'No tuve disposición',
    TOO_DIFFICULT: 'Fue demasiado difícil',
    OTHER: 'Otra razón'
  };

  return labels[value];
}
