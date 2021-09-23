import { PanelPlugin } from '@grafana/data';
import { Map3dPanelOptions } from './types';
import { Map3dPanel } from './Map3dPanel';

export const plugin = new PanelPlugin<Map3dPanelOptions>(Map3dPanel)
  .useFieldConfig()
  .setPanelOptions((builder) => {
    builder.addNumberInput({
      path: 'pitch',
      name: 'Pitch',
      description: 'Map pitch',
      defaultValue: 40,
    });
    builder.addNumberInput({
      path: 'bearing',
      name: 'Bearing',
      description: 'Map bearing',
      defaultValue: -37.6,
    });
    builder.addNumberInput({
      path: 'zoom',
      name: 'Zoom',
      description: 'Map initial zoom',
      defaultValue: 15.5,
    });
  })
  .setNoPadding();
