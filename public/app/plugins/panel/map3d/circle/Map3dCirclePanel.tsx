import '../css/global.css';
import { PanelProps } from '@grafana/data';
import React, { useMemo } from 'react';
import { createDonutChart } from '../helper/Map3dDonut';
import { Map3dPanelOptions } from '../types';
import { Map } from '@grafana/ui/src/components/MapLibre';
import { Marker } from 'maplibre-gl';
import { dataFrameToSeries, objectHash, Series } from '../utils';
import { openPopup } from '../helper/Map3dPopup';

/**
 * After map has been loaded, create the markers using the series
 * @param series
 * @param map
 */
const addMarkersToMap = (seriesArray: Series[], map: any) => {
  seriesArray.forEach((series: Series) => {
    const donutHtml: any = createDonutChart(series);
    donutHtml.addEventListener('click', () => {
      openPopup(map.map, series);
    });
    new Marker(donutHtml).setLngLat(series.coordinates).addTo(map.map);
  });
};

export function Map3dCirclePanel(props: PanelProps<Map3dPanelOptions>) {
  const key = useMemo(() => objectHash(props.options), [props.options]);
  const series = dataFrameToSeries(props);
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
      onLoad={(map) => addMarkersToMap(series, map)}
    ></Map>
  );
}
