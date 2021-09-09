import { DataFrame, Field } from '@grafana/data';
import { RSupport } from '@grafana/ui';

export function findField(frame: DataFrame, name?: string): Field | undefined {
  if (!name?.length) {
    return undefined;
  }

  for (const field of frame.fields) {
    if (RSupport.fieldNameMatches(frame, field, name)) {
      return field;
    }
  }
  return undefined;
}
