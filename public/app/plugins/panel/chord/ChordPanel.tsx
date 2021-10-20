import { PanelProps } from '@grafana/data';
import React from 'react';
import { ChordPanelOptions } from './types';
import Highcharts from 'highcharts';
import Sankey from 'highcharts/modules/sankey';
import DependencyWheel from 'highcharts/modules/dependency-wheel';
import HighchartsReact from 'highcharts-react-official';
import { config, getBackendSrv } from '@grafana/runtime';
import { getTimeSrv } from 'app/features/dashboard/services/TimeSrv';

Sankey(Highcharts); // Took a while to figure this out...
DependencyWheel(Highcharts);

// TODO this could potentially be extracted to a custom highcharts component, need to invest more time figuring out how to do it..
const isDarkMode = config.theme.isDark;
if (isDarkMode) {
  Highcharts.theme = {
    colors: [
      '#2b908f',
      '#90ee7e',
      '#f45b5b',
      '#7798BF',
      '#aaeeee',
      '#ff0066',
      '#eeaaee',
      '#55BF3B',
      '#DF5353',
      '#7798BF',
      '#aaeeee',
    ],
    chart: {
      backgroundColor: 'transparent',
      style: {
        fontFamily: "'Unica One', sans-serif",
      },
      plotBorderColor: '#606063',
    },
    title: {
      style: {
        color: '#E0E0E3',
        textTransform: 'uppercase',
        fontSize: '20px',
      },
    },
    subtitle: {
      style: {
        color: '#E0E0E3',
        textTransform: 'uppercase',
      },
    },
    xAxis: {
      gridLineColor: '#707073',
      labels: {
        style: {
          color: '#E0E0E3',
        },
      },
      lineColor: '#707073',
      minorGridLineColor: '#505053',
      tickColor: '#707073',
      title: {
        style: {
          color: '#A0A0A3',
        },
      },
    },
    yAxis: {
      gridLineColor: '#707073',
      labels: {
        style: {
          color: '#E0E0E3',
        },
      },
      lineColor: '#707073',
      minorGridLineColor: '#505053',
      tickColor: '#707073',
      tickWidth: 1,
      title: {
        style: {
          color: '#A0A0A3',
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      style: {
        color: '#F0F0F0',
      },
    },
    plotOptions: {
      series: {
        dataLabels: {
          color: '#F0F0F3',
          style: {
            fontSize: '13px',
          },
        },
        marker: {
          lineColor: '#333',
        },
      },
      boxplot: {
        fillColor: '#505053',
      },
      candlestick: {
        lineColor: 'white',
      },
      errorbar: {
        color: 'white',
      },
    },
    legend: {
      itemStyle: {
        color: '#E0E0E3',
      },
      itemHoverStyle: {
        color: '#FFF',
      },
      itemHiddenStyle: {
        color: '#606063',
      },
      title: {
        style: {
          color: '#C0C0C0',
        },
      },
    },
    credits: {
      style: {
        color: '#666',
      },
    },
    // @ts-ignore
    labels: {
      style: {
        color: '#707073',
      },
    },
    drilldown: {
      activeAxisLabelStyle: {
        color: '#F0F0F3',
      },
      activeDataLabelStyle: {
        color: '#F0F0F3',
      },
    },
    navigation: {
      buttonOptions: {
        symbolStroke: '#DDDDDD',
        theme: {
          fill: '#505053',
        },
      },
    },
    // scroll charts
    rangeSelector: {
      buttonTheme: {
        fill: '#505053',
        stroke: '#000000',
        style: {
          color: '#CCC',
        },
        states: {
          hover: {
            fill: '#707073',
            stroke: '#000000',
            style: {
              color: 'white',
            },
          },
          select: {
            fill: '#000003',
            stroke: '#000000',
            style: {
              color: 'white',
            },
          },
        },
      },
      inputBoxBorderColor: '#505053',
      inputStyle: {
        backgroundColor: '#333',
        color: 'silver',
      },
      labelStyle: {
        color: 'silver',
      },
    },
    navigator: {
      handles: {
        backgroundColor: '#666',
        borderColor: '#AAA',
      },
      outlineColor: '#CCC',
      maskFill: 'rgba(255,255,255,0.1)',
      series: {
        color: '#7798BF',
        lineColor: '#A6C7ED',
      },
      xAxis: {
        gridLineColor: '#505053',
      },
    },
    scrollbar: {
      barBackgroundColor: '#808083',
      barBorderColor: '#808083',
      buttonArrowColor: '#CCC',
      buttonBackgroundColor: '#606063',
      buttonBorderColor: '#606063',
      rifleColor: '#FFF',
      trackBackgroundColor: '#404043',
      trackBorderColor: '#404043',
    },
  };
  // Apply the theme
  Highcharts.setOptions(Highcharts.theme);
}

// NOTE: Lots of ts-ignore here, looks like not all the fields have been added in typescript yet
export function ChordPanel(props: PanelProps<ChordPanelOptions>) {
  const [chartOptions, setChartOptions] = React.useState({} as Highcharts.Options);

  // Re render chart because of panel resize
  // TODO this should be improved because it is re-rendering even after the mouse has dropped the panel
  React.useEffect(() => {
    if (chartOptions.chart !== undefined) {
      // Update state
      setChartOptions({ ...chartOptions, chart: { height: props.height, width: props.width } });
    }
  }, [props.height, props.width]);

  // Recalculate as appropriate
  React.useEffect(() => {
    // Make backend ajax call
    const queryParameters = {
      start: getTimeSrv().timeRange().from.format('yyyy-MM-DDTHH:mm:ss'),
      finish: getTimeSrv().timeRange().to.format('yyyy-MM-DDTHH:mm:ss'),
    };

    getBackendSrv()
      .get('/avenge/api/_/zone-transition/' + props.options.zoneTransitionCode, queryParameters)
      .then((r) => {
        // Map the data from the service to the correct format
        const data = r.responses.map((r: { from: any; to: any; occurrences: number }) => ({
          from: r.from.name,
          to: r.to.name,
          weight: r.occurrences,
        }));

        // Update the chart options
        // @ts-ignore
        setChartOptions({
          chart: {
            width: props.width,
            height: props.height,
          },
          credits: { enabled: false },
          title: {
            text: props.options.chartTitle,
          },
          accessibility: {
            point: {
              valueDescriptionFormat: '{index}. From {point.from} to {point.to}: {point.weight}.',
            },
          },
          series: [
            {
              keys: ['from', 'to', 'weight'],
              data: data,
              type: 'dependencywheel',
              animation: false,
              name: 'Dependency wheel series',
              dataLabels: {
                // allowOverlap: true,
                style: {
                  fontWeight: 'bold',
                  color: '#000000',
                  textOutline: '2px contrast',
                },
              },
              // @ts-ignore
              size: '100%',
              allowPointSelect: true,
            },
          ],
        });
      });
  }, [props.data, props.timeRange, props.options, props.fieldConfig, props.timeZone, props.options.zoneTransitionCode]);
  return (
    <div>
      <HighchartsReact highcharts={Highcharts} options={chartOptions} />
    </div>
  );
}
