import { SelectableValue } from '@grafana/data';

export interface ChordPanelOptions {
  chartTitle: string;
  type: ChordPanelType;
  zoneTransitionCode: SelectableValue[];
}

export enum ChordPanelType {
  Big = 'big',
  Small = 'small',
}
