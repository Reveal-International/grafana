import React, { Component } from 'react';
import { PanelProps } from '@grafana/data';
import { Map3dPanelOptions } from './types';
import { Map3dCirclePanel } from './circle/Map3dCirclePanel';
import { Map3dCylinderPanel } from './cylinder/Map3dCylinderPanel';

type Props = PanelProps<Map3dPanelOptions>;
type Map = any;

export class Map3dPanel extends Component<Props, Map> {
  componentDidMount() {
    lastMap3dPanelInstance = this;
  }

  // use to store the map instance that is created by the sub map3d panels (circle and cylinder)
  map: any;

  // function to be passed to one of the sub map3d panels (circle and cylinder) so we can update the local map instance
  // once mapLibre has been initialized
  updateMap = (map: any) => {
    this.map = map;
  };

  render() {
    if (this.props.options.displayType === 'cylinder') {
      // @ts-ignore
      return <Map3dCylinderPanel props={this.props} updateMap={this.updateMap} />;
    } else {
      return <Map3dCirclePanel props={this.props} updateMap={this.updateMap} />;
    }
  }
}

export let lastMap3dPanelInstance: any | undefined = undefined;
