import { PanelPlugin } from '@grafana/data';
import { defaultView, Map3dPanelOptions } from './types';
import { Map3dPanel } from './Map3dPanel';
import { MapViewEditor } from './editor/MapViewEditor';

export const plugin = new PanelPlugin<Map3dPanelOptions>(Map3dPanel)
  .useFieldConfig()
  .setPanelOptions((builder) => {
    builder.addCustomEditor({
      id: 'mapViewConfig',
      path: 'mapViewConfig',
      name: 'Initial view', // don't show it
      description: 'This location will show when the panel first loads',
      editor: MapViewEditor,
      defaultValue: defaultView,
    });
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
    builder.addSelect({
      path: 'displayType',
      name: 'Display Type',
      description: '',
      defaultValue: 'cylinder',
      settings: {
        options: [
          { value: 'cylinder', label: 'Cylinders' },
          { value: 'donut', label: 'Donuts' },
        ],
      },
    });
    builder.addSelect({
      path: 'legendPosition',
      name: 'Legend position',
      description: '',
      defaultValue: 'legend-bottom-right-corner',
      settings: {
        options: [
          { value: 'legend-bottom-right-corner', label: 'Bottom right corner' },
          { value: 'legend-top-right-corner', label: 'Top right corner' },
        ],
      },
    });
    builder.addSelect({
      path: 'legendFormat',
      name: 'Legend format',
      description: '',
      defaultValue: 'legend-list',
      settings: {
        options: [
          { value: 'legend-list', label: 'List' },
          { value: 'legend-flat', label: 'Flat' },
        ],
      },
    });
    builder.addNumberInput({
      path: 'minHeight',
      name: 'Min Height',
      description: 'Min column height (meters)',
      defaultValue: 100,
    });
    builder.addNumberInput({
      path: 'maxHeight',
      name: 'Max Height',
      description: 'Max column height (meters)',
      defaultValue: 500,
    });
    builder.addNumberInput({
      path: 'minRadius',
      name: 'Min Radius',
      description: 'Min radius (meters)',
      defaultValue: 10,
    });
    builder.addNumberInput({
      path: 'maxRadius',
      name: 'Max Radius',
      description: 'Max radius (meters)',
      defaultValue: 20,
    });
    builder.addSelect({
      path: 'mapType',
      name: 'Map Type',
      description: '',
      defaultValue: 'streets',
      settings: {
        options: [
          { value: 'streets', label: 'Streets' },
          { value: 'hybrid', label: 'Hybrid' },
          { value: 'outdoor', label: 'Outdoor' },
          { value: 'basic', label: 'Basic' },
        ],
      },
    });
    builder.addTextInput({
      path: 'accessToken',
      name: 'Access Token',
      description: 'Token for map tiles',
      defaultValue: 'get_your_own_OpIi9ZULNHzrESv6T2vL',
    });
  })
  .setNoPadding();
