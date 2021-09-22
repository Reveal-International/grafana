import { SelectableValue } from '@grafana/data';

import {
  SingleStatBaseOptions,
  BigValueColorMode,
  BigValueGraphMode,
  BigValueJustifyMode,
  BigValueTextMode,
} from '@grafana/ui';

export interface PopulationPanelOptions extends SingleStatBaseOptions {
  graphMode: BigValueGraphMode;
  colorMode: BigValueColorMode;
  justifyMode: BigValueJustifyMode;
  textMode: BigValueTextMode;
  populationZone: SelectableValue[];
}
