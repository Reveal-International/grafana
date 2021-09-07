import { OptionsWithTooltip } from '../models.gen';
import { PanelOptionsEditorBuilder } from '@grafana/data';
import { TooltipExtension } from '../../components';

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

  builder.addMultiSelect({
    path: 'tooltip.extensions',
    name: 'Tooltip Extensions',
    category: ['Tooltip'],
    description: 'Adds more information into the tooltips',
    defaultValue: 'none',
    settings: {
      options: [
        { value: 'date-offset', label: 'Date Offset' },
        { value: 'delta-numeric', label: 'Delta Numeric' },
        { value: 'delta-percent', label: 'Delta Percent' },
        { value: 'delta-trend', label: 'Delta Trend' },
      ],
    },
  });

  builder.addTextInput({
    path: 'tooltip.dateFormat',
    name: 'Tooltip Extension Date Range Time format',
    description: 'Date/time format applied to any extension tool tips',
    category: ['Tooltip'],
    defaultValue: 'DD-MM-YYYY',
    settings: {
      placeholder: 'DD-MM-YYYY',
      expandTemplateVars: true,
    },
    showIf: (c, data) => {
      return c.tooltip.extensions!.includes(TooltipExtension.DateOffset);
    },
  });
}
