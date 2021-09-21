import { PanelProps } from '@grafana/data';
import React from 'react';
import { ChordPanelOptions } from './types';
import Highcharts from 'highcharts';
import Sankey from 'highcharts/modules/sankey';
import DependencyWheel from 'highcharts/modules/dependency-wheel';
import HighchartsReact from 'highcharts-react-official';
import { config, getBackendSrv } from '@grafana/runtime';
import { getTimeSrv } from '../../../../../public/app/features/dashboard/services/TimeSrv';
import { dispatch } from '../../../store/store';

Sankey(Highcharts); // Took a while to figure this out...
DependencyWheel(Highcharts);

// TODO this could potentially be extracted to a custom highcharts component, need to invest more time figuring out how to do it..
const isDarkMode = config.theme.isDark;
if (isDarkMode) {
  Highcharts.theme = {
    colors: ['#058DC7', '#50B432', '#ED561B', '#DDDF00', '#24CBE5', '#64E572', '#FF9655', '#FFF263', '#6AF9C4'],
    chart: {
      backgroundColor: {
        // linearGradient: [0, 0, 500, 500],
        stops: [
          [0, 'rgb(255, 255, 255)'],
          [1, 'rgb(240, 240, 255)'],
        ],
      },
    },
    title: {
      style: {
        color: '#FFF',
        font: 'bold 16px "Trebuchet MS", Verdana, sans-serif',
      },
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
              point: {
                events: {
                  select: function () {
                    const type = 'APPLY_ROW_FILTER';
                    // @ts-ignore
                    if (this.isNode) {
                      // @ts-ignore
                      const { name, sum } = this;
                      dispatch({ type, nodes: [name], value: sum });
                    } else {
                      // assume a link
                      // @ts-ignore
                      const { from, to, weight } = this;
                      dispatch({ type, nodes: [from, to], value: weight });
                    }
                    return false;
                  },
                },
              },
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
