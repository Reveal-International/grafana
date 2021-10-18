import '../css/sidebar-common.css';
import { formatNumber } from '../utils';
import { lineChart } from './Map3dHighcharts';
import { config, getBackendSrv } from '@grafana/runtime';
import { GeoHashMetricGroup, Metric } from '../metrics/metric-parser';

const isDarkMode = config.theme.isDark;
if (isDarkMode) {
  require('../css/sidebar-dark.css');
} else {
  require('../css/sidebar-light.css');
}

/**
 * Opens a popup with donut information such as total traffic, traffic comparison with previous dates
 */
export function updateSidebarPopupHtml(geoHashMetricGroup: GeoHashMetricGroup, sidebarElement: any) {
  // Clean element first
  const sidebarContent = sidebarElement.getElementsByClassName('sidebar-content')[0];
  sidebarContent.innerHTML = '';

  const promise: any = getCounterInformation(geoHashMetricGroup.geoHash);
  promise.then((address: any) => {
    let map3dPopupHtml: any = map3dSidebar(geoHashMetricGroup, address);
    map3dPopupHtml.getElementsByClassName('sidebar-close')[0].addEventListener('click', () => {
      closeSidebar();
    });
    map3dPopupHtml.getElementsByClassName('view-chart')[0].addEventListener('click', () => {
      const sidebarBody = map3dPopupHtml.getElementsByClassName('sidebar-body')[0];
      lineChart(geoHashMetricGroup, address, sidebarBody);
    });
    sidebarContent.appendChild(map3dPopupHtml);
  });
}

export function map3dSidebar(geoHashMetricGroup: GeoHashMetricGroup, address: string): any {
  const popup = document.createElement('div');

  let seriesCount = '';
  geoHashMetricGroup.metrics.forEach((metric: Metric) => {
    const colorPercentage: number = Math.trunc(
      (metric.getAggregatedMetricValues() / geoHashMetricGroup.getAggregatedMetricValues()) * 100
    );
    seriesCount +=
      `<div class="series-counts">${metric.getAvailableName()} (${formatNumber(
        metric.getAggregatedMetricValues()
      )})</div>` +
      '<div class="bar-container">' +
      `   <div class="colored-bar" style="background-color: ${metric.getColor()}; width: ${colorPercentage}%">${colorPercentage}%</div>` +
      '</div>';
  });

  popup.innerHTML =
    '<div id="location-rollover">' +
    `   <div id="sidebar-geohash" style="display: none;">${geoHashMetricGroup.geoHash}</div>` +
    '   <div class="sidebar-header">' +
    '      <span class="sidebar-close" title="Close" >X</span>' +
    `      <div class="sidebar-title">${address}</div>` +
    '   </div>' +
    '   <div class="sidebar-body">' +
    `      <div class="total-counts">Total counts (${formatNumber(
      geoHashMetricGroup.getAggregatedMetricValues()
    )})</div>` +
    '      <hr class="solid">' +
    seriesCount +
    '      <hr class="solid">' +
    '      <button class="view-chart">View chart</button>' +
    '   </div>' +
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

export function getLegends(geoHashMetricGroup: GeoHashMetricGroup) {
  let mapLegend = '<div class="legend">';

  geoHashMetricGroup.metrics.forEach((metric) => {
    mapLegend += `<div><span style="background-color: ${metric.getColor()}"></span>${metric.getAvailableName()}</div>`;
  });
  mapLegend += '</div>';
  const mapLegendContainer = document.createElement('div');
  mapLegendContainer.innerHTML = mapLegend;

  return mapLegendContainer.firstChild;
}

export function getSidebarHtml(): any {
  const sidebars = document.createElement('div');
  sidebars.innerHTML =
    '<div id="left" class="sidebar flex-center left collapsed sidebar-main-container">' +
    '<div class="sidebar-content rounded-rect flex-center">' +
    '</div>' +
    '</div>';

  return sidebars;
}

export function removeSidebarHtml() {
  const sidebars: any = document.getElementsByClassName('sidebar-main-container');
  Array.from(sidebars).forEach((sidebar: any) => {
    sidebar.remove();
  });
}

export function closeSidebar() {
  const sidebarId = 'left';
  var elem = document.getElementById(sidebarId);
  // @ts-ignore
  var classes = elem.className.split(' ');
  var collapsed = classes.indexOf('collapsed') !== -1;

  var padding = {};

  if (!collapsed) {
    // @ts-ignore
    // Add the 'collapsed' class to the class list of the element
    padding[sidebarId] = 0;
    classes.push('collapsed');
  }

  // @ts-ignore
  // Update the class list on the element
  elem.className = classes.join(' ');
}

export function toggleSidebar(map: any, uniqueId: string) {
  const sidebarId = 'left';
  var elem = document.getElementById(sidebarId);
  // @ts-ignore
  var classes = elem.className.split(' ');
  var collapsed = classes.indexOf('collapsed') !== -1;

  var padding = {};

  if (collapsed && uniqueId !== '') {
    // Remove the 'collapsed' class from the class list of the element, this sets it back to the expanded state.
    classes.splice(classes.indexOf('collapsed'), 1);

    // @ts-ignore
    padding[sidebarId] = 300; // In px, matches the width of the sidebars set in .sidebar CSS class
    map.easeTo({
      padding: padding,
      duration: 1000, // In ms, CSS transition duration property for the sidebar matches this value
    });
  } else {
    // Check if the on-click event was triggered from another location, instead of collapsing the current sidebar we want to update it's information only
    const geoHashElement: any = document.getElementById('sidebar-geohash');
    if (geoHashElement.innerHTML === uniqueId) {
      // @ts-ignore
      // Add the 'collapsed' class to the class list of the element
      padding[sidebarId] = 0;
      classes.push('collapsed');

      map.easeTo({
        padding: padding,
        duration: 1000,
      });
    } else {
      // Don't collapse, let flow to update inner content of sidebar
    }
  }

  // @ts-ignore
  // Update the class list on the element
  elem.className = classes.join(' ');
}
