import Highcharts from 'highcharts';
import { GeoHashMetricGroup } from '../metrics/metric-parser';

export function lineChart(geoHashMetricGroup: GeoHashMetricGroup, title: string, container: any = {}): any {
  if (!container) {
    container = document.createElement('div');
  } else {
    // Clean element just in case
    container.innerHTML = '';
  }

  let isDatetimeChart = true;
  const highchartsData: any[] = [];
  geoHashMetricGroup.metrics.forEach((metric) => {
    const data: any[] = metric.values.map((metricValue) => {
      isDatetimeChart = metricValue.datetime !== undefined;
      return [metricValue.datetime, metricValue.value];
    });

    highchartsData.push({ name: metric.getAvailableName(), data: data, color: metric.color });
  });

  new Highcharts.Chart({
    chart: {
      renderTo: container,
      type: isDatetimeChart ? 'line' : 'column',
    },
    title: {
      // @ts-ignore
      text: null,
    },
    plotOptions: {
      series: {
        marker: {
          enabled: false,
        },
      },
    },
    credits: {
      enabled: false,
    },
    legend: {
      useHTML: true,
      labelFormatter: function () {
        return getSVGIcon(this.name);
      },
    },
    xAxis: {
      type: 'datetime',
      labels: {
        enabled: isDatetimeChart,
      },
    },
    yAxis: {
      title: {
        text: 'Traffic',
      },
    },
    series: highchartsData,
  });

  return container;
}

function getSVGIcon(type: string) {
  if (type.toLowerCase().includes('pedestrian')) {
    return '<svg height="30" width="30" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/></svg>';
  } else if (type.toLowerCase().includes('cycle')) {
    return '<svg height="30" width="30" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z"/></svg>';
  } else if (type.toLowerCase().includes('scooter')) {
    return '<svg height="30" width="30" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M7.82,16H15v-1c0-2.21,1.79-4,4-4h0.74l-1.9-8.44C17.63,1.65,16.82,1,15.89,1H12v2h3.89l1.4,6.25c0,0-0.01,0-0.01,0 c-2.16,0.65-3.81,2.48-4.19,4.75H7.82c-0.48-1.34-1.86-2.24-3.42-1.94c-1.18,0.23-2.13,1.2-2.35,2.38C1.7,16.34,3.16,18,5,18 C6.3,18,7.4,17.16,7.82,16z M5,16c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S5.55,16,5,16z"/><path d="M19,12c-1.66,0-3,1.34-3,3s1.34,3,3,3s3-1.34,3-3S20.66,12,19,12z M19,16c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1 S19.55,16,19,16z"/><path d="M11,20L7 20 13 23 13 21 17 21 11 18z"/></svg>';
  } else {
    // Question mark in case not found?
    return '<svg height="30" width="30" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>';
  }
}
