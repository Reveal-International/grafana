import { PanelProps } from '@grafana/data';
import React from 'react';
import { Map3dPanelOptions } from './types';
import { Map, MapLayer, MapMarker } from '@grafana/ui/src/components/MapLibre';
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
      {/*<MapMarker lngLat={cnTower}>*/}
      {/*  /!* render an html marker *!/*/}
      {/*  <div>CN Tower</div>*/}
      {/*</MapMarker>*/}

      {/* render a layer */}

      {/*<MapLayer*/}
      {/*  id="area-fill"*/}
      {/*  source="area"*/}
      {/*  type="fill"*/}
      {/*  paint={{*/}
      {/*    'fill-color': 'red',*/}
      {/*    'fill-opacity': 0.5,*/}
      {/*  }}*/}
      {/*>*/}
      {/*  <MapSource id="area" type="geojson" data={exampleGeoJson.features[0] as GeoJSON.Feature} generateId />*/}
      {/*</MapLayer>*/}

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
