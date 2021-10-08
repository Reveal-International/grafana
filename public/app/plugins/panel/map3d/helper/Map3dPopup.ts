import { formatNumber, Series } from '../utils';
import { lineChart } from './Map3dHighcharts';
import { Popup } from 'maplibre-gl';
import { getBackendSrv } from '@grafana/runtime';

/**
 * Opens a popup with donut information such as total traffic, traffic comparison with previous dates
 */
export function openPopup(map: any, series: Series, useCenterMapCoordinates = false) {
  const promise: any = getCounterInformation(series.geoHash);
  promise.then((address: any) => {
    let map3dPopupHtml: any = map3dPopup(series, address);
    map3dPopupHtml.getElementsByClassName('view-graph-button')[0].addEventListener('click', function () {
      const highChartLineChart: any = lineChart(series, address);
      popup.setLngLat(series.coordinates).setDOMContent(highChartLineChart).addTo(map);
    });

    if (useCenterMapCoordinates) {
      popup.setLngLat(map.getCenter());
    } else {
      popup.setLngLat(series.coordinates);
    }

    popup.setDOMContent(map3dPopupHtml).addTo(map);
  });
}

const popup = new Popup({
  closeButton: false,
  closeOnClick: true,
  maxWidth: 'none',
  className: 'map3d-popup',
});

export function map3dPopup(series: Series, address: string): any {
  const popup = document.createElement('div');
  // TODO doing some assumptions here regarding the position of the KPIs (metrics)
  // Need to improve this, but for now, the order defined should be pedestrian, cycle and scooter
  popup.innerHTML =
    '<div id="location-rollover" style="top: 145px; left: 211px; display: block;">' +
    '<div class="selector-arrow" style="top: 62px;"></div>' +
    '<div class="rollover-wrap">' +
    '<div class="rollover-header">' +
    `<div class="rollover-address">${address}</div>` +
    '</div>' +
    '<div class="rollover-body">' +
    '<div class="rollover-bars-wrap">' +
    `<span>Total traffic count: ${formatNumber(series.totalValue)}</span>` +
    '</div>' +
    '<div class="rollover-bars-wrap">' +
    `<span>Pedestrian traffic count: ${formatNumber(series.getAggregatedSeriesValues()[0])}</span>` +
    '</div>' +
    '<div class="rollover-bars-wrap">' +
    `<span>Cycle traffic count: ${formatNumber(series.getAggregatedSeriesValues()[1])}</span>` +
    '</div>' +
    '<div class="rollover-bars-wrap">' +
    `<span>Scooter traffic count: ${formatNumber(series.getAggregatedSeriesValues()[2])}</span>` +
    '</div>' +
    '<div class="rollover-bars-wrap view-graph-button">' +
    '<img src="public/app/plugins/panel/map3d/img/view-graph-btn.png" alt="View graph" class="view-graph-button">' +
    '</div>' +
    '' +
    '</div>' +
    '</div>';

  return popup.firstChild;
}

function getCounterInformation(geoHash: string) {
  return new Promise(function (resolve, reject) {
    const queryParameters = { singleCounter: true, singleAddress: true };
    getBackendSrv()
      .get('/avenge/api/_/geocounter/' + geoHash, queryParameters)
      .then(
        (response) => {
          resolve(response.address.line1);
        },
        (error) => {
          reject(error);
        }
      );
  });
}
