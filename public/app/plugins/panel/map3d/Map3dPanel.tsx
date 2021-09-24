/* eslint-disable */
import {
  Field,
  getFieldColorModeForField,
  getScaleCalculator,
  GrafanaTheme2,
  PanelProps
} from '@grafana/data';
import React, {useMemo} from 'react';
import * as turf from '@turf/turf';
import { Map3dPanelOptions } from './types';
import { Map, MapLayer, MapSource } from '@grafana/ui/src/components/MapLibre';
import { FillExtrusionPaint, LngLatLike } from 'maplibre-gl';
import { config } from 'app/core/config';
import {decodeGeohash} from "../geomap/utils/geohash";

const accessToken = 'get_your_own_OpIi9ZULNHzrESv6T2vL';
const centerCoordinates: LngLatLike = [174.76613, -36.849034];

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

function hash(s: string) {
  var hash = 0;
  if (s.length === 0) {
    return hash;
  }
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = ((hash<<5)-hash)+char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

export function Map3dPanel(props: PanelProps<Map3dPanelOptions>) {
  const key = useMemo(() => hash(JSON.stringify(props.options)), [props.options])
  const overlay = dataFrameToOverlay(config.theme2, props);
  const mapStyle = useMemo(() => {
      return `https://api.maptiler.com/maps/${props.options.mapType}/style.json?key=${accessToken}`
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
      'fill-extrusion-opacity': 0.5,
    };
  }, [props.options]);

  return (
    <Map
      key={key}
      // you can use MapboxGL with an accesstoken
      // accessToken={accessToken}

      // maptiler usage
      mapStyle={mapStyle}
      style={{
        height: props.height,
        width: props.width,
      }}
      defaultZoom={props.options.zoom}
      pitch={props.options.pitch}
      bearing={props.options.bearing}
      defaultCenter={centerCoordinates}
    >
      {/*/!* render a standard marker marker *!/*/}
      {/*<MapMarker lngLat={centerCoordinates} />*/}

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
