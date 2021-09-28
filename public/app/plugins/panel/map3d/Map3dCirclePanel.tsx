import { getFieldColorModeForField, getScaleCalculator, GrafanaTheme2, PanelProps } from '@grafana/data';
import React, { useMemo } from 'react';
import { Map3dPanelOptions } from './types';
import { Map, MapLayer, MapSource } from '@grafana/ui/src/components/MapLibre';
import { dataFramesToRows, objectHash } from './utils';
import { config } from '@grafana/runtime';
import * as turf from '@turf/turf';
import { CirclePaint } from 'maplibre-gl';

function dataFrameToOverlay(theme: GrafanaTheme2, props: PanelProps<Map3dPanelOptions>) {
  const rows = dataFramesToRows(theme, props.data.series);
  let features: any[] = [];
  // We are creating a stacked bar cylinder here
  rows.rows.forEach((row) => {
    let baseHeight = 0;
    row.columns.forEach((column) => {
      if (column.value <= 0) {
        return;
      }
      // Height proportional to column
      let height = props.options.maxHeight * (column.value / rows.largestColumnValue);
      if (height < props.options.minHeight) {
        height = props.options.minHeight;
      }
      // Radius proportional to total value of row
      let radius = props.options.maxRadius * (row.totalValue / rows.largestColumnValue);
      if (radius < props.options.minRadius) {
        radius = props.options.minRadius;
      }
      const mode = getFieldColorModeForField(column.field);
      let color;
      if (!mode.isByValue) {
        color = mode.getCalculator(column.field, theme)(0, 0);
      } else {
        const scale = getScaleCalculator(column.field, theme);
        color = scale(column.value).color;
      }

      const radiusKm = radius / 1000;
      // Creates a circle with properties that are then extruded into a cylinder
      const circle = turf.point(row.location, {
        properties: { height: height, base_height: baseHeight, color: color, radius: radiusKm },
      });
      // console.log({ column, radiusKm, height, baseHeight, color, circle });
      features.push(circle);
      baseHeight += height;
    });
  });
  return {
    type: 'FeatureCollection',
    features: features,
  };
}

export function Map3dCirclePanel(props: PanelProps<Map3dPanelOptions>) {
  const key = useMemo(() => objectHash(props.options), [props.options]);
  const overlay = dataFrameToOverlay(config.theme2, props);
  const mapStyle = useMemo(() => {
    return `https://api.maptiler.com/maps/${props.options.mapType}/style.json?key=${props.options.accessToken}`;
  }, [props.options]);
  const circlePaint = useMemo((): CirclePaint => {
    return {
      // Effectively as switch statement for categories.
      'circle-color': ['get', 'color'],
      'circle-opacity': 0.6,
      'circle-radius': ['get', 'radius'],
    } as CirclePaint;
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
    >
      <MapSource type="geojson" id="overlay-source" data={overlay as GeoJSON.FeatureCollection} />

      <MapLayer id="overlay-circles" type="circle" source="overlay-source" paint={circlePaint} />
    </Map>
  );
}
