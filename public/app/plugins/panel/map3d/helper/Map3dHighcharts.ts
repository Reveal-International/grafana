import Highcharts from 'highcharts';
import { Series } from '../utils';

export function lineChart(series: Series, title: string): any {
  var dom = document.createElement('div');

  const names: string[] = ['pedestrian', 'cycle', 'scooter'];
  const highchartsData: any[] = [];

  names.forEach((name: string, index: number) => {
    const values: any[] = series.values.map((seriesValue) => {
      const datetime: number = seriesValue.datetime;
      const value = seriesValue.values[index];
      return [datetime, value];
    });

    highchartsData.push({ name: name, data: values });
  });

  new Highcharts.Chart({
    chart: {
      renderTo: dom,
      type: 'line',
      width: 300,
      height: 300,
    },
    title: {
      text: title,
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
        return `<img src='/public/app/plugins/panel/map3d/img/${this.name}.svg' width='30' height='30'>`;
      },
    },
    xAxis: {
      type: 'datetime',
    },
    yAxis: {
      title: {
        text: 'Traffic',
      },
    },
    series: highchartsData,
  });

  return dom;
}
