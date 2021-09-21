import { PanelPlugin } from '@grafana/data';
import { ChordPanel } from './ChordPanel';
import { ChordPanelOptions, ChordPanelType } from './types';

export const plugin = new PanelPlugin<ChordPanelOptions>(ChordPanel)
  .setPanelOptions((builder) => {
    // See other plugins for creating complex options here
    // note the path is into the ChordPanelOptions object used in the panel.
    const mainCategory = ['Chord styles'];
    builder.addSelect({
      path: 'type',
      name: 'Type',
      description: 'Type of chord diagram',
      category: mainCategory,
      settings: {
        options: [
          { value: ChordPanelType.Big, label: 'Big' },
          { value: ChordPanelType.Small, label: 'Small' },
        ],
      },
      defaultValue: 'big',
    });
    builder.addTextInput({
      path: 'chartTitle',
      name: 'Title of chart',
      description: 'Chart title',
      settings: {
        placeholder: 'title',
      },
    });
    builder.addTextInput({
      path: 'zoneTransitionCode',
      name: 'Zone Transition Code',
      description: 'Zone transition code configured in the client',
      settings: {
        placeholder: 'zone_transition_code',
      },
    });
  })
  .setNoPadding();
