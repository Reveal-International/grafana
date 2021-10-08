import { GrafanaTheme2, PanelProps } from '@grafana/data';
import React, { useMemo } from 'react';
import * as turf from '@turf/turf';
import { Map3dPanelOptions } from '../types';
// Had to add alias to Map otherwise it clashes with the use of Map (from collections)
import { Map as MapLibre, MapLayer, MapSource } from '@grafana/ui/src/components/MapLibre';
import { MercatorCoordinate } from 'maplibre-gl';
import { config } from 'app/core/config';
import { dataFrameToSeries, objectHash, Series } from '../utils';
import * as THREE from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { createDonutChart } from '../helper/Map3dDonut';
import { openPopup } from '../helper/Map3dPopup';

const seriesHeightMap: Map<string, number> = new Map();

function getColors(): string[] {
  const isDarkMode = config.theme.isDark;
  if (isDarkMode) {
    return ['#2b908f', '#90ee7e', '#f45b5b'];
  }
  // Otherwise return light colors
  return ['#058DC7', '#64E572', '#ED561B'];
}

function seriesToOverlay(theme: GrafanaTheme2, props: PanelProps<Map3dPanelOptions>, series: Series[]) {
  let features: any[] = [];
  const largestSeriesValues: number = Math.max(...series.map((s) => s.getLargestSeriesValue()));

  // We are creating a stacked bar cylinder here
  series.forEach((individualSeries) => {
    let baseHeight = 0;
    const aggregatedSeriesValues: number[] = individualSeries.getAggregatedSeriesValues();
    aggregatedSeriesValues.forEach((seriesValues, index) => {
      if (seriesValues <= 0) {
        return;
      }
      // Height proportional to column
      let height = props.options.maxHeight * (seriesValues / largestSeriesValues);
      if (height < props.options.minHeight) {
        height = props.options.minHeight;
      }
      // Radius proportional to total value of row
      let radius = props.options.maxRadius * (individualSeries.totalValue / largestSeriesValues);
      if (radius < props.options.minRadius) {
        radius = props.options.minRadius;
      }

      const radiusKm = radius / 1000;
      // Creates a circle with properties that are then extruded into a cylinder
      const circle = turf.circle(individualSeries.coordinates, radiusKm, {
        properties: {
          height: baseHeight + height,
          base_height: baseHeight,
          color: getColors()[index],
          totalValue: individualSeries.totalValue,
        },
      });

      features.push(circle);
      baseHeight += height;
    });
    seriesHeightMap.set(individualSeries.geoHash, baseHeight);
  });

  return {
    type: 'FeatureCollection',
    features: features,
  };
}

const createCloudDonuts = (map: any, series: Series[]) => {
  series.forEach((s: Series, index: number) => {
    const donutHtml: any = createDonutChart(s);
    donutHtml.addEventListener('click', () => {
      openPopup(map.map, s, true);
    });
    const layer = createLayer(s, donutHtml, index);
    map.map.addLayer(layer);
  });
};

function createLayer(series: Series, donutHtml: any, index: any) {
  // parameters to ensure the model is geo-referenced correctly on the map
  let modelOrigin: any = series.coordinates;
  let modelAltitude = 0;
  let modelRotate = [Math.PI / 2, 0, 0];

  let modelAsMercatorCoordinate = MercatorCoordinate.fromLngLat(modelOrigin, modelAltitude);

  // transformation parameters to position, rotate and scale the 3D model onto the map
  let modelTransform = {
    translateX: modelAsMercatorCoordinate.x,
    translateY: modelAsMercatorCoordinate.y,
    translateZ: modelAsMercatorCoordinate.z,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    /* Since our 3D model is in real world meters, a scale transform needs to be
     * applied since the CustomLayerInterface expects units in MercatorCoordinates.
     */
    scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
  };

  let customLayer: any = {
    id: '3d-model' + index,
    type: 'custom',
    renderingMode: '3d',
    onAdd: function (map: any, gl: any) {
      this.camera = new THREE.Camera();
      this.scene = new THREE.Scene();

      // use the three.js GLTF loader to add the 3D model to the three.js scene
      this.map = map;

      // use the Mapbox GL JS map canvas for three.js
      // @ts-ignore

      this.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
      });

      this.renderer.autoClear = false;

      //create the renderer
      // @ts-ignore
      // var pepe = window.THREE;
      // @ts-ignore
      this.popupRenderer = new CSS2DRenderer();
      this.popupRenderer.setSize(this.map.getCanvas().clientWidth, this.map.getCanvas().clientHeight);
      this.popupRenderer.domElement.style.position = 'absolute';
      // this.popupRenderer.domElement.id = 'labelCanvas';
      this.popupRenderer.domElement.style.top = 0;
      this.map.getCanvasContainer().appendChild(this.popupRenderer.domElement);
      // @ts-ignore
      let popupAlt = new CSS2DObject(donutHtml);
      // @ts-ignore
      popupAlt.position.set(0, seriesHeightMap.get(series.geoHash) + 20, 0);
      this.scene.add(popupAlt);
    },
    render: function (gl: any, matrix: any) {
      var rotationX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), modelTransform.rotateX);
      var rotationY = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), modelTransform.rotateY);
      var rotationZ = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), modelTransform.rotateZ);

      var m = new THREE.Matrix4().fromArray(matrix);
      var l = new THREE.Matrix4()
        .makeTranslation(
          modelTransform.translateX,
          modelTransform.translateY,
          // @ts-ignore
          modelTransform.translateZ
        )
        .scale(new THREE.Vector3(modelTransform.scale, -modelTransform.scale, modelTransform.scale))
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ);

      this.camera.projectionMatrix = m.multiply(l);
      this.renderer.state.reset();
      this.renderer.render(this.scene, this.camera);
      this.popupRenderer.render(this.scene, this.camera);
      this.map.triggerRepaint();
    },
  };

  return customLayer;
}

export function Map3dCylinderPanel(props: PanelProps<Map3dPanelOptions>) {
  const key = useMemo(() => objectHash(props.options), [props.options]);
  const series = dataFrameToSeries(props);
  const overlay = seriesToOverlay(config.theme2, props, series);
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
    <MapLibre
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
      onLoad={(map) => createCloudDonuts(map, series)}
    >
      <MapSource type="geojson" id="overlay-source" data={overlay as GeoJSON.FeatureCollection} />
      <MapLayer
        id="overlay-extrusion"
        type="fill-extrusion"
        source="overlay-source"
        // @ts-ignore
        paint={overlayPaint}
      />
    </MapLibre>
  );
}
