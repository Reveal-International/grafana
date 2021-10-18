import { PanelProps } from '@grafana/data';
import React, { useMemo } from 'react';
import { createDonutChart, removeAllDonuts } from '../helper/Map3dDonut';
import { Map3dPanelOptions } from '../types';
import { Map } from '@grafana/ui/src/components/MapLibre';
import { Marker } from 'maplibre-gl';
import { objectHash } from '../utils';
import { getSidebarHtml, removeSidebarHtml, toggleSidebar, updateSidebarPopupHtml } from '../helper/Map3dSidebar';
import { GeoHashMetricGroup, getGeoHashMetricGroups } from '../metrics/metric-parser';

export function Map3dCirclePanel(props: PanelProps<Map3dPanelOptions>) {
  const [geoHashMetricGroups, setGeoHashMetricGroups] = React.useState([] as GeoHashMetricGroup[]);
  const [map, setMap] = React.useState({});

  /**
   * Removes all markers and custom html elements from map.
   */
  const cleanupMap = () => {
    removeSidebarHtml();
    removeAllDonuts();
  };

  /**
   * After map has been loaded, create the markers using the series
   * @param series
   * @param map
   */
  const addMarkersToMap = (geoHashMetricGroups: GeoHashMetricGroup[], map: any) => {
    setMap(map);
    // Add sidebar container
    const sidebarElement: any = getSidebarHtml();
    const mapContainer = map.map.getContainer();
    mapContainer.appendChild(sidebarElement);

    geoHashMetricGroups.forEach((geoHashMetricGroup: GeoHashMetricGroup) => {
      const donutHtml: any = createDonutChart(geoHashMetricGroup);
      donutHtml.addEventListener('click', () => {
        toggleSidebar(map.map, geoHashMetricGroup.geoHash);
        updateSidebarPopupHtml(geoHashMetricGroup, sidebarElement);
      });

      const marker: Marker = new Marker(donutHtml).setLngLat(geoHashMetricGroup.coordinates);
      marker.addTo(map.map);
    });
  };

  React.useEffect(() => {
    // Update the metrics
    setGeoHashMetricGroups(getGeoHashMetricGroups(props));
    console.log('updating metrics due to date range change!');
  }, [props.timeRange, map]);

  React.useEffect(() => {
    // Metrics or map changed, updating
    cleanupMap();
    if (Object.keys(map).length !== 0) {
      addMarkersToMap(geoHashMetricGroups, map);
    }
  }, [geoHashMetricGroups, map]);

  const key = useMemo(() => objectHash(props.options), [props.options]);
  const mapStyle = useMemo(() => {
    return `https://api.maptiler.com/maps/${props.options.mapType}/style.json?key=${props.options.accessToken}`;
  }, [props.options]);

  // @ts-ignore
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
      onLoad={(map) => addMarkersToMap(geoHashMetricGroups, map)}
    ></Map>
  );
}
