import { DisplayValue, FieldType, getDisplayProcessor, PanelProps } from '@grafana/data';
import { BigValue, BigValueGraphMode } from '@grafana/ui';
import { config } from 'app/core/config';
import React from 'react';
import { PopulationPanelOptions } from './types';

export function PopulationPanel(props: PanelProps<PopulationPanelOptions>) {
  const [population, setPopulation] = React.useState({ numeric: 0, text: '' } as DisplayValue);
  const options = props.options as PopulationPanelOptions;
  // Recalculate as appropriate
  React.useEffect(() => {
    // TODO make an ajax call to get the population zone!
    const val = new Date().getTime();
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
  }, [props.data, props.timeRange, props.options, props.fieldConfig, props.timeZone]);
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
