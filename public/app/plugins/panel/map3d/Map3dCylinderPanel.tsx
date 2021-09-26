import { getFieldColorModeForField, getScaleCalculator, GrafanaTheme2, PanelProps } from '@grafana/data';
import React, { useMemo } from 'react';
import * as turf from '@turf/turf';
import { Map3dPanelOptions } from './types';
import { Map, MapLayer, MapSource } from '@grafana/ui/src/components/MapLibre';
import { FillExtrusionPaint } from 'maplibre-gl';
import { config } from 'app/core/config';
import { dataFramesToRows, objectHash } from './utils';

function dataFrameToOverlay(theme: GrafanaTheme2, props: PanelProps<Map3dPanelOptions>) {
  const rows = dataFramesToRows(props.data.series);
  let features: any[] = [];
  // We are creating a stacked bar cylinder here
  rows.rows.forEach((row) => {
    let baseHeight = 0;
    row.columns.forEach((column) => {
      if (column.value <= 0) {
        return;
      }
      // Height proportional to column
      let height = props.options.maxHeight * (column.value / rows.largestValue);
      if (height < props.options.minHeight) {
        height = props.options.minHeight;
      }
      // Radius proportional to total value of row
      let radius = props.options.maxRadius * (row.totalValue / rows.largestValue);
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
      const circle = turf.circle(row.location, radiusKm, {
        properties: { height: height, base_height: baseHeight, color: color },
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

export function Map3dCylinderPanel(props: PanelProps<Map3dPanelOptions>) {
  const key = useMemo(() => objectHash(props.options), [props.options]);
  const overlay = dataFrameToOverlay(config.theme2, props);
  const mapStyle = useMemo(() => {
    return `https://api.maptiler.com/maps/${props.options.mapType}/style.json?key=${props.options.accessToken}`;
  }, [props.options]);
  const overlayPaint = useMemo(() => {
    return {
      // See the Mapbox Style Specification for details on data expressions.
      // https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions
      // Get the fill-extrusion-color from the source 'color' property.
      'fill-extrusion-color': ['get', 'color'],
      // Get fill-extrusion-height from the source 'height' property.
      'fill-extrusion-height': ['get', 'height'],
      // Get fill-extrusion-base from the source 'base_height' property.
      'fill-extrusion-base': ['get', 'base_height'],
      // Make extrusions slightly opaque for see through indoor walls.
      'fill-extrusion-opacity': 0.8, // TODO make configurable
    };
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

      <MapLayer
        id="overlay-extrusion"
        type="fill-extrusion"
        source="overlay-source"
        paint={overlayPaint as FillExtrusionPaint}
      />
    </Map>
  );
}
