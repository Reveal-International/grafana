import { PanelProps } from '@grafana/data';
import React from 'react';
import { ChordPanelOptions } from './types';
import Highcharts from 'highcharts';
import Sankey from 'highcharts/modules/sankey';
import DependencyWheel from 'highcharts/modules/dependency-wheel';
import HighchartsReact from 'highcharts-react-official';

Sankey(Highcharts); // Took a while to figure this out...
DependencyWheel(Highcharts);

export function ChordPanel(props: PanelProps<ChordPanelOptions>) {
  const [chartOptions, setChartOptions] = React.useState({} as Highcharts.Options);

  React.useEffect(() => {
    // TODO load real data from ajax call -- see PopulationPanel.tsx
    setChartOptions({
      chart: {
        width: props.width,
        height: props.height,
      },
      title: {
        text: props.options.chartTitle,
      },
      series: [
        {
          keys: ['from', 'to', 'weight'],
          data: [
            { from: 'Brazil', to: 'Portugal', weight: 5 },
            { from: 'Brazil', to: 'France', weight: 1 },
            { from: 'Brazil', to: 'Spain', weight: 1 },
            { from: 'Brazil', to: 'England', weight: 1 },
            { from: 'Canada', to: 'Portugal', weight: 1 },
            { from: 'Canada', to: 'France', weight: 5 },
            { from: 'Canada', to: 'England', weight: 1 },
            { from: 'Mexico', to: 'Portugal', weight: 1 },
            { from: 'Mexico', to: 'France', weight: 1 },
            { from: 'Mexico', to: 'Spain', weight: 5 },
            { from: 'Mexico', to: 'England', weight: 1 },
            { from: 'USA', to: 'Portugal', weight: 1 },
            { from: 'USA', to: 'France', weight: 1 },
            { from: 'USA', to: 'Spain', weight: 1 },
            { from: 'USA', to: 'England', weight: 5 },
            { from: 'Portugal', to: 'Angola', weight: 2 },
            { from: 'Portugal', to: 'Senegal', weight: 1 },
            { from: 'Portugal', to: 'Morocco', weight: 1 },
            { from: 'Portugal', to: 'South Africa', weight: 3 },
            { from: 'France', to: 'Angola', weight: 1 },
            { from: 'France', to: 'Senegal', weight: 3 },
            { from: 'France', to: 'Mali', weight: 3 },
            { from: 'France', to: 'Morocco', weight: 3 },
            { from: 'France', to: 'South Africa', weight: 1 },
            { from: 'Spain', to: 'Senegal', weight: 1 },
            { from: 'Spain', to: 'Morocco', weight: 3 },
            { from: 'Spain', to: 'South Africa', weight: 1 },
            { from: 'England', to: 'Angola', weight: 1 },
            { from: 'England', to: 'Senegal', weight: 1 },
            { from: 'England', to: 'Morocco', weight: 2 },
            { from: 'England', to: 'South Africa', weight: 7 },
            { from: 'South Africa', to: 'China', weight: 5 },
            { from: 'South Africa', to: 'India', weight: 1 },
            { from: 'South Africa', to: 'Japan', weight: 3 },
            { from: 'Angola', to: 'China', weight: 5 },
            { from: 'Angola', to: 'India', weight: 1 },
            { from: 'Angola', to: 'Japan', weight: 3 },
            { from: 'Senegal', to: 'China', weight: 5 },
            { from: 'Senegal', to: 'India', weight: 1 },
            { from: 'Senegal', to: 'Japan', weight: 3 },
            { from: 'Mali', to: 'China', weight: 5 },
            { from: 'Mali', to: 'India', weight: 1 },
            { from: 'Mali', to: 'Japan', weight: 3 },
            { from: 'Morocco', to: 'China', weight: 5 },
            { from: 'Morocco', to: 'India', weight: 1 },
            { from: 'Morocco', to: 'Japan', weight: 3 },
            { from: 'Japan', to: 'Brazil', weight: 1 },
          ],
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
            // distance: 10
          },
          // size: '95%'
        },
      ],
    });
  }, [props.timeRange, props.options, props.width, props.height]);

  return (
    <div>
      <HighchartsReact highcharts={Highcharts} options={chartOptions} />
    </div>
  );
}
