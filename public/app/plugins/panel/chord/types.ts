export interface ChordPanelOptions {
  chartTitle: string;
  type: ChordPanelType;
  zoneTransitionCode: string;
}

export enum ChordPanelType {
  Big = 'big',
  Small = 'small',
}
