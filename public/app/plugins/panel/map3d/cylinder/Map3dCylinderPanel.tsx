import { GrafanaTheme2, PanelProps } from '@grafana/data';
import React, { useMemo } from 'react';
import * as turf from '@turf/turf';
import { Map3dPanelOptions } from '../types';
// Had to add alias to Map otherwise it clashes with the use of Map (from collections)
import { Map as MapLibre, MapLayer, MapSource } from '@grafana/ui/src/components/MapLibre';
import { MercatorCoordinate } from 'maplibre-gl';
import { config } from 'app/core/config';
import { objectHash } from '../utils';
import * as THREE from 'three';
import { CSS2DObject, CSS2DRenderer } from '../renderer/CSS2DRenderer';
import { createDonutChart, removeAllDonuts } from '../helper/Map3dDonut';
import { getSidebarHtml, removeSidebarHtml, toggleSidebar, updateSidebarPopupHtml } from '../helper/Map3dSidebar';
import { GeoHashMetricGroup, getGeoHashMetricGroups } from '../metrics/metric-parser';

const metricsHeightMap: Map<string, number> = new Map();

/**
 * Creates an overlay from the geo hash metric groups, this is used as input data for the MapSource and MapLayer to create the cylinders
 */
function geoHashMetricGroupsToOverlay(
  theme: GrafanaTheme2,
  props: PanelProps<Map3dPanelOptions>,
  geoHashMetricGroups: GeoHashMetricGroup[]
) {
  let features: any[] = [];
  const largestMetricValue: number = Math.max(
    ...geoHashMetricGroups.map((geoHashMetricGroup) => geoHashMetricGroup.getAggregatedMetricValues())
  );

  // We are creating a stacked bar cylinder here
  geoHashMetricGroups.forEach((geoHashMetricGroup) => {
    let baseHeight = 0;
    geoHashMetricGroup.metrics.forEach((metric, index) => {
      if (metric.getAggregatedMetricValues() <= 0) {
        return;
      }
      // Height proportional to column
      let height = props.options.maxHeight * (metric.getAggregatedMetricValues() / largestMetricValue);
      if (height < props.options.minHeight) {
        height = props.options.minHeight;
      }
      // Radius proportional to total value of row
      let radius = props.options.maxRadius * (geoHashMetricGroup.getAggregatedMetricValues() / largestMetricValue);
      if (radius < props.options.minRadius) {
        radius = props.options.minRadius;
      }

      const radiusKm = radius / 1000;
      // Creates a circle with properties that are then extruded into a cylinder
      const circle = turf.circle(geoHashMetricGroup.coordinates, radiusKm, {
        properties: {
          height: baseHeight + height,
          base_height: baseHeight,
          color: metric.getColor(),
          totalValue: geoHashMetricGroup.getAggregatedMetricValues(),
        },
      });

      features.push(circle);
      baseHeight += height;
    });
    metricsHeightMap.set(geoHashMetricGroup.geoHash, baseHeight);
  });

  return {
    type: 'FeatureCollection',
    features: features,
  };
}

export function Map3dCylinderPanel(props: PanelProps<Map3dPanelOptions>) {
  const [customDonutLayers, setCustomDonutLayers] = React.useState([] as any);
  const [geoHashMetricGroups, setGeoHashMetricGroups] = React.useState([] as GeoHashMetricGroup[]);
  const [map, setMap] = React.useState({});
  const key = useMemo(() => objectHash(props.options), [props.options]);
  const overlay = geoHashMetricGroupsToOverlay(config.theme2, props, geoHashMetricGroups);

  /**
   * Creates an special type of layer that is able to be rendered on certain height.
   * This layer is populated with a donut html element.
   */
  const createLayer = (geoHashMetricGroup: GeoHashMetricGroup, donutHtml: any, index: any) => {
    // parameters to ensure the model is geo-referenced correctly on the map
    let modelOrigin: any = geoHashMetricGroup.coordinates;
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
        this.renderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl,
          antialias: true,
        });

        this.renderer.autoClear = false;

        //create the renderer
        this.popupRenderer = new CSS2DRenderer();
        this.popupRenderer.setSize(this.map.getCanvas().clientWidth, this.map.getCanvas().clientHeight);
        this.popupRenderer.domElement.className = 'custom-donut-layer';
        this.popupRenderer.domElement.style.position = 'absolute';
        this.popupRenderer.domElement.style.top = 0;
        this.map.getCanvasContainer().appendChild(this.popupRenderer.domElement);
        // @ts-ignore
        let popupAlt = new CSS2DObject(donutHtml);
        // @ts-ignore
        popupAlt.position.set(0, metricsHeightMap.get(geoHashMetricGroup.geoHash) + 20, 0);
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

    customDonutLayers.push(customLayer);
    setCustomDonutLayers(customDonutLayers);

    return customLayer;
  };

  /**
   * Adds custom layers, html donuts and sidebar popup
   */
  const addLayersToMap = (geoHashMetricGroups: GeoHashMetricGroup[], map: any) => {
    // Update map state
    setMap(map);

    // Add sidebar container
    const sidebarElement: any = getSidebarHtml();
    const mapContainer = map.map.getContainer();
    mapContainer.appendChild(sidebarElement);

    geoHashMetricGroups.forEach((geoHashMetricGroup: GeoHashMetricGroup, index: number) => {
      const donutHtml: any = createDonutChart(geoHashMetricGroup);
      const layer = createLayer(geoHashMetricGroup, donutHtml, index);
      donutHtml.addEventListener('click', () => {
        toggleSidebar(map.map, geoHashMetricGroup.geoHash);
        updateSidebarPopupHtml(geoHashMetricGroup, sidebarElement);
      });
      map.map.addLayer(layer);
    });
  };

  /**
   * Removes all markers and custom html elements from map.
   */
  const cleanupMap = () => {
    removeSidebarHtml();

    customDonutLayers.forEach((customDonutLayer: any) => {
      // @ts-ignore
      const layer = map.map.getLayer(customDonutLayer.id);
      if (layer !== undefined) {
        // @ts-ignore
        map.map.removeLayer(customDonutLayer.id);
        console.log(`removing layer with id ${customDonutLayer.id}`);
      }
    });
    // Now remove the actual donut html
    console.log('removing html donuts');
    removeAllDonuts();
    setCustomDonutLayers([]);
  };

  /**
   * Update metrics when time range changes
   */
  React.useEffect(() => {
    // Update the metrics
    setGeoHashMetricGroups(getGeoHashMetricGroups(props));
    console.log('updating metrics due to date range change!');
  }, [props.timeRange]);

  /**
   * Clean up the map (remove custom layers and html elements) and re render the custom objects
   */
  React.useEffect(() => {
    // Metrics or map changed, updating
    cleanupMap();
    if (Object.keys(map).length !== 0) {
      addLayersToMap(geoHashMetricGroups, map);
    }
  }, [geoHashMetricGroups]);

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
      onLoad={(map) => addLayersToMap(geoHashMetricGroups, map)}
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
