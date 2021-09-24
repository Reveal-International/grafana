/* eslint-disable */
import {
  Field,
  getFieldColorModeForField,
  getScaleCalculator,
  GrafanaTheme2,
  PanelProps
} from '@grafana/data';
import React from 'react';
import * as turf from '@turf/turf';
import { Map3dPanelOptions } from './types';
import { Map, MapLayer, MapMarker, MapSource } from '@grafana/ui/src/components/MapLibre';
import { FillExtrusionPaint, LngLatLike } from 'maplibre-gl';
import { config } from 'app/core/config';
import {decodeGeohash} from "../geomap/utils/geohash";

const accessToken = 'get_your_own_OpIi9ZULNHzrESv6T2vL';
const centerCoordinates: LngLatLike = [174.76613, -36.849034];

const extrusionPaint = {
  'fill-extrusion-color': '#aaa',
  // use an 'interpolate' expression to add a smooth transition effect to the
  // buildings as the user zooms in
  'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['get', 'height']],
  'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['get', 'min_height']],
  'fill-extrusion-opacity': 0.6,
};

function largestValue(field: Field) : number {
  let largest = 0
  for (let valueIndex = 0; valueIndex < field.values.length; valueIndex++) {
    const value = field.values.get(valueIndex);
    if (value > largest) {
      largest = value;
    }
  }
  return largest
}

function dataFrameToOverlay(theme: GrafanaTheme2, props: PanelProps<Map3dPanelOptions>) {
  let features = [];
  if (props.data && props.data.series) {
    for (let dataFrameIndex = 0; dataFrameIndex < props.data.series.length; dataFrameIndex++) {
      const dataFrame = props.data.series[dataFrameIndex];
      if (!dataFrame.fields) {
        continue;
      }
      // Assumption first field is the location as GEO JSON
      const locationField = dataFrame.fields[0];
      for (let valueIndex = 0; valueIndex < locationField.values.length; valueIndex++) {
        for (let fieldIndex = 1; fieldIndex < dataFrame.fields.length; fieldIndex++) {
          const field = dataFrame.fields[fieldIndex];
          const max = largestValue(field);
          // const [lat, long] = decodeGeohash(lo)
          const coords = decodeGeohash(locationField.values.get(valueIndex));
          const value = field.values.get(valueIndex);
          let height = props.options.maxHeight * (value / max)
          if (height < props.options.minHeight) {
            height = props.options.minHeight;
          }
          let radius = props.options.maxRadius * (value / max)
          if (radius < props.options.minRadius) {
            radius = props.options.minRadius;
          }
          const mode = getFieldColorModeForField(field);
          let color;
          if (!mode.isByValue) {
            color = mode.getCalculator(field, theme)(0, 0);
          } else {
            const scale = getScaleCalculator(field, theme);
            color = scale(value).color;
          }

          const circle1 = turf.circle(coords!, radius/1000, {
            properties: { height: height, base_height: 0, color: color},
          });
          features.push(circle1)
          // console.log({fieldIndex, valueIndex, lat, long, value})
        }
      }
    }
  }
  return {
    type: 'FeatureCollection',
    features: features,
  };
}

export function Map3dPanel(props: PanelProps<Map3dPanelOptions>) {
  // TODO need to solve how we update the map when props change
  const key = `${props.options.zoom}-${props.options.pitch}-${props.options.bearing}`;
  const overlay = dataFrameToOverlay(config.theme2, props);
  const overlayPaint = {
    // See the Mapbox Style Specification for details on data expressions.
    // https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions
    // Get the fill-extrusion-color from the source 'color' property.
    'fill-extrusion-color': ['get', 'color'],
    // Get fill-extrusion-height from the source 'height' property.
    'fill-extrusion-height': ['get', 'height'],
    // Get fill-extrusion-base from the source 'base_height' property.
    'fill-extrusion-base': ['get', 'base_height'],
    // Make extrusions slightly opaque for see through indoor walls.
    'fill-extrusion-opacity': 0.5,
  };

  return (
    <Map
      key={key}
      // you can use MapboxGL with an accesstoken
      // accessToken={accessToken}

      // maptiler usage
      mapStyle={`https://api.maptiler.com/maps/streets/style.json?key=${accessToken}`}
      style={{
        height: props.height,
        width: props.width,
      }}
      defaultZoom={props.options.zoom}
      pitch={props.options.pitch}
      bearing={props.options.bearing}
      defaultCenter={centerCoordinates}
    >
      {/* render a standard marker marker */}
      <MapMarker lngLat={centerCoordinates} />

      <MapSource type="geojson" id="overlay-source" data={overlay as GeoJSON.FeatureCollection} />
      <MapLayer
        id="overlay-extrusion"
        type="fill-extrusion"
        source="overlay-source"
        paint={overlayPaint as FillExtrusionPaint}
      ></MapLayer>

      <MapLayer
        id="3d-buildings"
        type="fill-extrusion"
        source="openmaptiles"
        source-layer="building"
        minzoom={15}
        filter={['==', 'extrude', 'true']}
        paint={extrusionPaint as FillExtrusionPaint}
      />
    </Map>
  );
}
