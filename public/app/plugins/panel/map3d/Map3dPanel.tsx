import { PanelProps } from '@grafana/data';
import React from 'react';
import * as turf from '@turf/turf';
import { Map3dPanelOptions } from './types';
import { Map, MapLayer, MapMarker, MapSource } from '@grafana/ui/src/components/MapLibre';
import { FillExtrusionPaint, LngLatLike } from 'maplibre-gl';

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

export function Map3dPanel(props: PanelProps<Map3dPanelOptions>) {
  // TODO need to solve how we update the map when props change
  const key = `${props.options.zoom}-${props.options.pitch}-${props.options.bearing}`;
  const circle1 = turf.circle([174.77123737335205, -36.84480417706003], 0.01, {
    properties: { height: 200, base_height: 0, color: 'orange' },
  });
  const circle2 = turf.circle([174.76419925689697, -36.84820411284973], 0.02, {
    properties: { height: 500, base_height: 0, color: 'blue' },
  });
  const circle3 = turf.circle([174.7786783256836, -36.84820411284973], 0.02, {
    properties: { height: 300, base_height: 0, color: 'green' },
  });
  const overlay = {
    type: 'FeatureCollection',
    features: [circle1, circle2, circle3],
  };
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
