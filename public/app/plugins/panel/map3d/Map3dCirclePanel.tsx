import './css/global.css';
import { getFieldColorModeForField, getScaleCalculator, GrafanaTheme2, PanelProps } from '@grafana/data';
import React, { useMemo } from 'react';
import { Map3dPanelOptions } from './types';
import { Map } from '@grafana/ui/src/components/MapLibre';
import { Marker, Popup } from 'maplibre-gl';
import { dataFramesToRows, objectHash } from './utils';
import { config } from '@grafana/runtime';

function dataFrameToSeries(theme: GrafanaTheme2, props: PanelProps<Map3dPanelOptions>) {
  const series: any = [];
  const rows = dataFramesToRows(theme, props.data.series);

  rows.rows.forEach((row) => {
    // push all rows to series so then can be used in the cloud donuts
    let innerSeries: any = [];
    row.columns.forEach((column, index) => {
      if (column.value <= 0) {
        return;
      }

      // TODO need to configure colors by KPIs?
      const mode = getFieldColorModeForField(column.field);
      let color;
      if (!mode.isByValue) {
        color = mode.getCalculator(column.field, theme)(0, 0);
      } else {
        const scale = getScaleCalculator(column.field, theme);
        color = scale(column.value).color;
      }

      innerSeries.push({ value: column.value, color: color });
    });

    const serie = { coord: row.location, totalValue: row.totalValue, innerSeries: innerSeries };
    series.push(serie);
  });

  return series;
}

/**
 * After map has been loaded, create the markers using the series
 * @param series
 * @param map
 */
const addMarkersToMap = (series: any, map: any) => {
  series.forEach((serie: any) => {
    const donutHtml = createDonutChart(serie);
    // @ts-ignore
    donutHtml.addEventListener('mouseenter', function () {
      openPopup(map.map, serie);
    });
    // @ts-ignore
    donutHtml.addEventListener('mouseleave', function () {
      closePopup(map.map);
    });
    // @ts-ignore
    new Marker(donutHtml).setLngLat(serie.coord).addTo(map.map);
  });
};

// TODO create auxiliary class
// Creates an SVG donut chart from series
const createDonutChart = (serie: any) => {
  var offsets = [0];
  var total = serie.totalValue;

  // Set the offset values that will be used to create the donut arcs
  // Goes from 0 to next value until just 1 value before the end
  for (var i = 0; i < serie.innerSeries.length - 1; i++) {
    offsets.push(offsets[i] + serie.innerSeries[i].value);
  }

  // TODO find a way to adjust these values more accordingly
  // Font size depending on the number being displayed
  var fontSize = total >= 1000 ? 22 : total >= 100 ? 20 : total >= 10 ? 18 : 16;
  // Radius of circle depending on the number being displayed
  var r = total >= 1000 ? 50 : total >= 100 ? 32 : total >= 10 ? 24 : 18;

  var r0 = Math.round(r * 0.6);
  var w = r * 2;

  var html =
    '<div><svg width="' +
    w +
    '" height="' +
    w +
    '" viewbox="0 0 ' +
    w +
    ' ' +
    w +
    '" text-anchor="middle" style="font: ' +
    fontSize +
    'px sans-serif; display: block">';

  for (i = 0; i < serie.innerSeries.length; i++) {
    html += donutSegment(
      offsets[i] / total,
      (offsets[i] + serie.innerSeries[i].value) / total,
      r,
      r0,
      serie.innerSeries[i].color
    );
  }
  html +=
    '<circle cx="' +
    r +
    '" cy="' +
    r +
    '" r="' +
    r0 +
    '" fill="white" /><text dominant-baseline="central" transform="translate(' +
    r +
    ', ' +
    r +
    ')">' +
    total.toLocaleString() +
    '</text></svg></div>';

  let el = document.createElement('div');
  el.innerHTML = html;
  return el.firstChild;
};

// TODO create auxiliary class
/**
 * Creates an outline segment of a circle (an arc of the donut)
 */
const donutSegment = (start: any, end: any, r: any, r0: any, color: any) => {
  if (end - start === 1) {
    end -= 0.00001;
  }
  var a0 = 2 * Math.PI * (start - 0.25);
  var a1 = 2 * Math.PI * (end - 0.25);
  var x0 = Math.cos(a0),
    y0 = Math.sin(a0);
  var x1 = Math.cos(a1),
    y1 = Math.sin(a1);
  var largeArc = end - start > 0.5 ? 1 : 0;

  return [
    '<path d="M',
    r + r0 * x0,
    r + r0 * y0,
    'L',
    r + r * x0,
    r + r * y0,
    'A',
    r,
    r,
    0,
    largeArc,
    1,
    r + r * x1,
    r + r * y1,
    'L',
    r + r0 * x1,
    r + r0 * y1,
    'A',
    r0,
    r0,
    0,
    largeArc,
    0,
    r + r0 * x0,
    r + r0 * y0,
    '" fill="' + color + '" />',
  ].join(' ');
};

/**
 * Opens a popup with donut information such as total traffic, traffic comparison with previous dates
 */
const openPopup = (map: any, serie: any) => {
  // Change the cursor style as a UI indicator (hand-like mouse pointer)
  map.getCanvas().style.cursor = 'pointer';

  // TODO extract to component
  var htmlPopup =
    '<div id="location-rollover" style="top: 145px; left: 211px; display: block;">' +
    '<div class="selector-arrow" style="top: 62px;"></div>' +
    '<div class="rollover-wrap">' +
    '<div class="rollover-header">' +
    '<div class="rollover-region">Queen Street</div>' +
    '<div class="rollover-address">45 Queen Street</div>' +
    '<div class="rollover-count">2,371</div>' +
    '</div>' +
    '' +
    '<div class="rollover-body">' +
    '<div class="rollover-bars-wrap" id="average-view">' +
    '<div class="rollover-label rollover-total">Total <span style="text-transform:lowercase;">vs</span> average previous <span class="period-label">4 days</span></div>' +
    '<div class="rollover-bars cf">' +
    '<img src="https://www.heartofthecity.co.nz/pedestrian-count/static/theme/marker.svg" alt="" class="rollover-marker rollover-marker-average" style="left: 208px;">' +
    '<div class="rollover-bar"></div><div class="rollover-bar"></div><div class="rollover-bar"></div>' +
    '</div>' +
    '</div>' +
    '' +
    '<div class="rollover-bars-wrap" id="compare-view" style="margin-bottom: 0px;">' +
    '<div class="rollover-label rollover-year">Total <span style="text-transform:lowercase;">vs</span> same time last year</div>' +
    '<div class="rollover-bars cf">' +
    '<img src="https://www.heartofthecity.co.nz/pedestrian-count/static/theme/marker.svg" alt="" class="rollover-marker rollover-marker-lastyear" style="left: 39px;">' +
    '<div class="rollover-bar"></div><div class="rollover-bar"></div><div class="rollover-bar"></div>' +
    '</div>' +
    '</div>' +
    '' +
    '</div>' +
    '</div>';

  popup.setLngLat(serie.coord).setHTML(htmlPopup).addTo(map);
};

const closePopup = (map: any) => {
  map.getCanvas().style.cursor = '';
  popup.remove();
};

var popup = new Popup({
  closeButton: false,
  closeOnClick: false,
  maxWidth: 'none',
});

export function Map3dCirclePanel(props: PanelProps<Map3dPanelOptions>) {
  const key = useMemo(() => objectHash(props.options), [props.options]);
  // const overlay = dataFrameToOverlay(config.theme2, props);
  const series = dataFrameToSeries(config.theme2, props);
  const mapStyle = useMemo(() => {
    return `https://api.maptiler.com/maps/${props.options.mapType}/style.json?key=${props.options.accessToken}`;
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
      onLoad={(map) => addMarkersToMap(series, map)}
    ></Map>
  );
}
