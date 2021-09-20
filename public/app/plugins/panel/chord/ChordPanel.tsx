import { PanelProps } from '@grafana/data';
import React from 'react';
import { ChordPanelOptions } from './types';
import Highcharts from 'highcharts';
import Sankey from 'highcharts/modules/sankey';
import DependencyWheel from 'highcharts/modules/dependency-wheel';
import HighchartsReact from 'highcharts-react-official';
import { getBackendSrv } from '@grafana/runtime';
import { getTimeSrv } from '../../../../../public/app/features/dashboard/services/TimeSrv';

Sankey(Highcharts); // Took a while to figure this out...
DependencyWheel(Highcharts);

export function ChordPanel(props: PanelProps<ChordPanelOptions>) {
  const [chartOptions, setChartOptions] = React.useState({} as Highcharts.Options);

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
        // eslint-disable-next-line no-console
        console.log('Zone transition response', r);

        const data = r.responses.map((r: { from: any; to: any; occurrences: number }) => ({
          from: r.from.name,
          to: r.to.name,
          weight: r.occurrences,
        }));
        console.log(data);
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
              name: 'Dependency wheel series',
              dataLabels: {
                color: '#333',
                textPath: {
                  enabled: true,
                  attributes: {
                    dy: 5,
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
