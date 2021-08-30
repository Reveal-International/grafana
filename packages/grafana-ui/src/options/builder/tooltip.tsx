import { OptionsWithTooltip } from '../models.gen';
import { PanelOptionsEditorBuilder } from '@grafana/data';

export function addTooltipOptions<T extends OptionsWithTooltip>(
  builder: PanelOptionsEditorBuilder<T>,
  singleOnly = false
) {
  const options = singleOnly
    ? [
        { value: 'single', label: 'Single' },
        { value: 'none', label: 'Hidden' },
      ]
    : [
        { value: 'single', label: 'Single' },
        { value: 'multi', label: 'All' },
        { value: 'none', label: 'Hidden' },
      ];

  builder.addRadio({
    path: 'tooltip.mode',
    name: 'Tooltip mode',
    category: ['Tooltip'],
    description: '',
    defaultValue: 'single',
    settings: {
      options,
    },
  });

  builder.addTextInput({
    path: 'tooltip.timeOffsetFormat',
    name: 'Time offset format',
    description: 'Date format applied to any offset time ranges',
    category: ['Tooltip'],
    defaultValue: '',
    settings: {
      placeholder: 'DD-MM-YYYY HH:mm:ss',
    },
  });
}
