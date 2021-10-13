import '../css/sidebar-common.css';
import { formatNumber, Series } from '../utils';
import { lineChart } from './Map3dHighcharts';
import { config, getBackendSrv } from '@grafana/runtime';

function getColors(): string[] {
  const isDarkMode = config.theme.isDark;
  if (isDarkMode) {
    require('../css/sidebar-dark.css');
    return ['#2b908f', '#90ee7e', '#f45b5b'];
  }
  // Otherwise return light colors
  require('../css/sidebar-light.css');
  return ['#058DC7', '#64E572', '#ED561B'];
}

/**
 * Opens a popup with donut information such as total traffic, traffic comparison with previous dates
 */
export function updateSidebarPopupHtml(series: Series, sidebarElement: any) {
  // Clean element first
  const sidebarContent = sidebarElement.getElementsByClassName('sidebar-content')[0];
  sidebarContent.innerHTML = '';

  const promise: any = getCounterInformation(series.geoHash);
  promise.then((address: any) => {
    let map3dPopupHtml: any = map3dSidebar(series, address);
    map3dPopupHtml.getElementsByClassName('view-chart')[0].addEventListener('click', () => {
      const sidebarBody = map3dPopupHtml.getElementsByClassName('sidebar-body')[0];
      lineChart(series, address, sidebarBody);
    });
    sidebarContent.appendChild(map3dPopupHtml);
  });
}

export function map3dSidebar(series: Series, address: string): any {
  const popup = document.createElement('div');
  // TODO doing some assumptions here regarding the position of the KPIs (metrics)
  // Need to improve this, but for now, the order defined should be pedestrian, cycle and scooter
  const pedestrianPercentage: number = Math.trunc((series.getAggregatedSeriesValues()[0] / series.totalValue) * 100);
  const cyclePercentage: number = Math.trunc((series.getAggregatedSeriesValues()[1] / series.totalValue) * 100);
  const scooterPercentage: number = Math.trunc((series.getAggregatedSeriesValues()[2] / series.totalValue) * 100);

  popup.innerHTML =
    '<div id="location-rollover">' +
    `   <div id="sidebar-geohash" style="display: none;">${series.geoHash}</div>` +
    '   <div class="sidebar-header">' +
    `      <div class="sidebar-title">${address}</div>` +
    '   </div>' +
    '   <div class="sidebar-body">' +
    `      <div class="total-counts">Total counts (${formatNumber(series.totalValue)})</div>` +
    '      <hr class="solid">' +
    `      <div class="series-counts">Pedestrian (${formatNumber(series.getAggregatedSeriesValues()[0])})</div>` +
    '      <div class="bar-container">' +
    `         <div class="colored-bar" style="background-color: ${
      getColors()[0]
    }; width: ${pedestrianPercentage}%">${pedestrianPercentage}%</div>` +
    '      </div>' +
    `      <div class="series-counts">Cycle (${formatNumber(series.getAggregatedSeriesValues()[1])})</div>` +
    '      <div class="bar-container">' +
    `         <div class="colored-bar" style="background-color: ${
      getColors()[1]
    }; width: ${cyclePercentage}%">${cyclePercentage}%</div>` +
    '      </div>' +
    `      <div class="series-counts">Scooter (${formatNumber(series.getAggregatedSeriesValues()[2])})</div>` +
    '      <div class="bar-container">' +
    `         <div class="colored-bar" style="background-color: ${
      getColors()[2]
    }; width: ${scooterPercentage}%">${scooterPercentage}%</div>` +
    '      </div>' +
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
