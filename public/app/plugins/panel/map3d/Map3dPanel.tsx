import React from 'react';
import { PanelProps } from '@grafana/data';
import { Map3dPanelOptions } from './types';
import { Map3dDonutPanel } from './Map3dDonutPanel';
import { Map3dCylinderPanel } from './Map3dCylinderPanel';

export function Map3dPanel(props: PanelProps<Map3dPanelOptions>) {
  if (props.options.displayType === 'cylinder') {
    return <Map3dCylinderPanel {...props} />;
  } else {
    return <Map3dDonutPanel {...props} />;
  }
}
