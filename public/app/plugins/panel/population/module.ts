import { BigValueColorMode, BigValueTextMode, commonOptionsBuilder } from '@grafana/ui';
import { PanelPlugin } from '@grafana/data';
import { PopulationPanel } from './PopulationPanel';
import { PopulationPanelOptions } from './types';
import { addOrientationOption } from '../stat/types';

export const plugin = new PanelPlugin<PopulationPanelOptions>(PopulationPanel)
  .useFieldConfig()
  .setPanelOptions((builder) => {
    const mainCategory = ['Population styles'];

    addOrientationOption(builder, mainCategory);
    commonOptionsBuilder.addTextSizeOptions(builder);

    builder.addSelect({
      path: 'textMode',
      name: 'Text mode',
      description: 'Control if name and value is displayed or just name',
      category: mainCategory,
      settings: {
        options: [
          { value: BigValueTextMode.Auto, label: 'Auto' },
          { value: BigValueTextMode.Value, label: 'Value' },
          { value: BigValueTextMode.ValueAndName, label: 'Value and name' },
          { value: BigValueTextMode.Name, label: 'Name' },
          { value: BigValueTextMode.None, label: 'None' },
        ],
      },
      defaultValue: 'auto',
    });

    builder
      .addRadio({
        path: 'colorMode',
        name: 'Color mode',
        defaultValue: BigValueColorMode.Value,
        category: mainCategory,
        settings: {
          options: [
            { value: BigValueColorMode.None, label: 'None' },
            { value: BigValueColorMode.Value, label: 'Value' },
            { value: BigValueColorMode.Background, label: 'Background' },
          ],
        },
      })
      .addRadio({
        path: 'justifyMode',
        name: 'Text alignment',
        defaultValue: 'auto',
        category: mainCategory,
        settings: {
          options: [
            { value: 'auto', label: 'Auto' },
            { value: 'center', label: 'Center' },
          ],
        },
      });

    builder.addTextInput({
      path: 'populationZone',
      name: 'Zone code',
      description: 'Population zone code.',
      settings: {
        placeholder: 'my_zone',
      },
    });
  })
  .setNoPadding();
