import { PanelProps } from '@grafana/data';
import React, { useMemo } from 'react';
import { Map3dPanelOptions } from './types';
import { Map } from '@grafana/ui/src/components/MapLibre';
import { objectHash } from './utils';

export function Map3dDonutPanel(props: PanelProps<Map3dPanelOptions>) {
  const key = useMemo(() => objectHash(props.options), [props.options]);
  const mapStyle = useMemo(() => {
    return `https://api.maptiler.com/maps/${props.options.mapType}/style.json?key=${props.options.accessToken}`;
  }, [props.options]);

  return (
    <Map
      key={key}
      mapStyle={mapStyle}
      style={{
        height: props.height,
        width: props.width,
      }}
      defaultZoom={props.options.zoom}
      pitch={props.options.pitch}
      bearing={props.options.bearing}
      defaultCenter={props.options.initialCoords}
    ></Map>
  );
}
