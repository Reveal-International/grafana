import { LngLat } from 'maplibre-gl';

export type DisplayType = 'cylinder' | 'circle';

export interface Map3dPanelOptions {
  displayType: DisplayType;
  legendPosition: string;
  legendFormat: string;
  mapType: string;
  pitch: number;
  bearing: number;
  zoom: number;
  minHeight: number;
  maxHeight: number;
  minRadius: number;
  maxRadius: number;
  initialCoords: LngLat;
  accessToken: string;
}
