import { PanelProps } from '@grafana/data';
import React, { useMemo } from 'react';
import { createDonutChart, removeAllDonuts } from '../helper/Map3dDonut';
import { Map3dPanelOptions } from '../types';
import { Map } from '@grafana/ui/src/components/MapLibre';
import { Marker } from 'maplibre-gl';
import { objectHash } from '../utils';
import {
  getLegends,
  getSidebarHtml,
  removeSidebarHtml,
  toggleSidebar,
  updateSidebarPopupHtml,
} from '../helper/Map3dSidebar';
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

  const filterDonutChart = (geoHashMetricGroups: GeoHashMetricGroup[]) => {
    cleanupMap();
    // @ts-ignore
    const mapContainer = map.map.getContainer();

    // Add sidebar container
    const sidebarElement: any = getSidebarHtml();
    mapContainer.appendChild(sidebarElement);

    // Find out the disable metric names from the legend
    const disabledLegendElements: HTMLCollectionOf<Element> = document.getElementsByClassName('legend-item-disabled');
    const disabledLegendNames = Array.from(disabledLegendElements).map((disabledLegend) => {
      return disabledLegend.innerHTML.substring(
        disabledLegend.innerHTML.indexOf('</span>') + 7,
        disabledLegend.innerHTML.length
      );
    });

    const filteredGeoHashMetricGroups: GeoHashMetricGroup[] = geoHashMetricGroups.map((geoHashMetricGroup) => {
      // Create a copy of the geo hash metrics so we dont modify the actual one
      geoHashMetricGroup = geoHashMetricGroup.getCopy();
      const filteredMetrics = geoHashMetricGroup.metrics.filter(
        (metric) => !disabledLegendNames.includes(metric.getAvailableName())
      );
      geoHashMetricGroup.metrics = filteredMetrics;

      return geoHashMetricGroup;
    });

    filteredGeoHashMetricGroups.forEach((geoHashMetricGroup: GeoHashMetricGroup) => {
      if (geoHashMetricGroup.getAggregatedMetricValues() > 0) {
        const donutHtml: any = createDonutChart(geoHashMetricGroup);
        donutHtml.addEventListener('click', () => {
          // @ts-ignore
          toggleSidebar(map.map, geoHashMetricGroup.geoHash);
          updateSidebarPopupHtml(geoHashMetricGroup, sidebarElement);
        });

        const marker: Marker = new Marker(donutHtml).setLngLat(geoHashMetricGroup.coordinates);
        // @ts-ignore
        marker.addTo(map.map);
      }
    });
  };

  /**
   * After map has been loaded, create the markers using the series
   * @param series
   * @param map
   */
  const addMarkersToMap = (
    geoHashMetricGroups: GeoHashMetricGroup[],
    map: any,
    props: PanelProps<Map3dPanelOptions>
  ) => {
    setMap(map);
    const mapContainer = map.map.getContainer();

    // Add sidebar container
    const sidebarElement: any = getSidebarHtml();
    mapContainer.appendChild(sidebarElement);

    // Add legends
    if (geoHashMetricGroups.length > 0) {
      // First item will do as all the other items contain the same metrics
      const legendsElement = getLegends(
        geoHashMetricGroups[0],
        props.options.legendPosition,
        props.options.legendFormat,
        () => filterDonutChart(geoHashMetricGroups)
      );
      mapContainer.appendChild(legendsElement);
    }

    geoHashMetricGroups.forEach((geoHashMetricGroup: GeoHashMetricGroup) => {
      if (geoHashMetricGroup.getAggregatedMetricValues() > 0) {
        const donutHtml: any = createDonutChart(geoHashMetricGroup);
        donutHtml.addEventListener('click', () => {
          toggleSidebar(map.map, geoHashMetricGroup.geoHash);
          updateSidebarPopupHtml(geoHashMetricGroup, sidebarElement);
        });

        const marker: Marker = new Marker(donutHtml).setLngLat(geoHashMetricGroup.coordinates);
        marker.addTo(map.map);
      }
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
      addMarkersToMap(geoHashMetricGroups, map, props);
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
      onLoad={(map) => addMarkersToMap(geoHashMetricGroups, map, props)}
    ></Map>
  );
}
