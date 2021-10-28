export type DisplayType = 'cylinder' | 'circle';

export interface Map3dPanelOptions {
  displayType: DisplayType;
  legendPosition: string;
  legendFormat: string;
  mapType: string;
  pitch: number;
  bearing: number;
  mapViewConfig: MapViewConfig;
  minHeight: number;
  maxHeight: number;
  minRadius: number;
  maxRadius: number;
  accessToken: string;
}

export interface MapViewConfig {
  lat?: number;
  lon?: number;
  zoom?: number;
}

export const defaultView: MapViewConfig = {
  lat: 0,
  lon: 0,
  zoom: 1,
};
