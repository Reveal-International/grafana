import { OptionsWithTooltip, TooltipExtension, TooltipDisplayMode, SortOrder } from '@grafana/schema';
import { PanelOptionsEditorBuilder } from '@grafana/data';

export function addTooltipOptions<T extends OptionsWithTooltip>(
  builder: PanelOptionsEditorBuilder<T>,
  singleOnly = false
) {
  const category = ['Tooltip'];
  const modeOptions = singleOnly
    ? [
        { value: TooltipDisplayMode.Single, label: 'Single' },
        { value: TooltipDisplayMode.None, label: 'Hidden' },
      ]
    : [
        { value: TooltipDisplayMode.Single, label: 'Single' },
        { value: TooltipDisplayMode.Multi, label: 'All' },
        { value: TooltipDisplayMode.None, label: 'Hidden' },
      ];

  const sortOptions = [
    { value: SortOrder.None, label: 'None' },
    { value: SortOrder.Ascending, label: 'Ascending' },
    { value: SortOrder.Descending, label: 'Descending' },
  ];

  builder
    .addRadio({
      path: 'tooltip.mode',
      name: 'Tooltip mode',
      category,
      defaultValue: 'single',
      settings: {
        options: modeOptions,
      },
    })
    .addRadio({
      path: 'tooltip.sort',
      name: 'Values sort order',
      category,
      defaultValue: SortOrder.None,
      showIf: (options: T) => options.tooltip.mode === TooltipDisplayMode.Multi,
      settings: {
        options: sortOptions,
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
