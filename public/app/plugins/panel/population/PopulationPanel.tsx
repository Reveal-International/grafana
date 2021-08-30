import { DisplayValue, FieldType, getDisplayProcessor, PanelProps } from '@grafana/data';
import { BigValue, BigValueGraphMode } from '@grafana/ui';
import { config } from 'app/core/config';
import React from 'react';
import { PopulationPanelOptions } from './types';
import { getBackendSrv } from '@grafana/runtime';

export function PopulationPanel(props: PanelProps<PopulationPanelOptions>) {
  const [population, setPopulation] = React.useState({ numeric: 0, text: '' } as DisplayValue);
  const options = props.options as PopulationPanelOptions;
  // Recalculate as appropriate
  React.useEffect(() => {
    // Make backend ajax call
    if (!options.populationZone) {
      setPopulation({ numeric: 0, text: 'No Zone' });
      return;
    }
    getBackendSrv()
      .request({
        url: '/avenge/api/_/population/' + options.populationZone,
        showErrorAlert: false,
      })
      .then((r) => {
        // eslint-disable-next-line no-console
        console.debug('Population response', r);
        const val = r.population;
        // Use a display processor which handles thresholds
        const display = getDisplayProcessor({
          field: {
            type: FieldType.number,
            config: props.fieldConfig.defaults,
          },
          theme: config.theme2,
          timeZone: props.timeZone,
        });
        let pop = display(val);
        // Add in title
        pop.title = props.fieldConfig.defaults.displayName;
        // Set the state
        setPopulation(pop);
      })
      .catch((error) => {
        console.error('Population error:', error);
        setPopulation({ numeric: 0, text: 'Zone Error' });
      });
  }, [props.timeRange, props.options, props.fieldConfig, props.timeZone, options.populationZone]);
  // Render a big value
  return (
    <BigValue
      value={population}
      colorMode={options.colorMode}
      graphMode={BigValueGraphMode.None}
      justifyMode={options.justifyMode}
      textMode={options.textMode}
      text={options.text}
      width={props.width}
      height={props.height}
      theme={config.theme2}
    />
  );
}
