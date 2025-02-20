import React from 'react';
import { DropResult } from 'react-beautiful-dnd';

import { StandardEditorProps } from '@grafana/data';
import { Container } from '@grafana/ui';
import { AddLayerButton } from 'app/core/components/Layers/AddLayerButton';
import { LayerDragDropList } from 'app/core/components/Layers/LayerDragDropList';
import { FrameState } from 'app/features/canvas/runtime/frame';

import { GeomapInstanceState } from '../GeomapPanel';
import { geomapLayerRegistry } from '../layers/registry';
import { GeomapPanelOptions, MapLayerState } from '../types';

import { dataLayerFilter } from './layerEditor';

type LayersEditorProps = StandardEditorProps<any, any, GeomapPanelOptions, GeomapInstanceState>;

export const LayersEditor = (props: LayersEditorProps) => {
  const { layers, selected, actions } = props.context.instanceState ?? {};
  if (!layers || !actions) {
    return <div>No layers?</div>;
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const { layers, actions } = props.context.instanceState ?? {};
    if (!layers || !actions) {
      return;
    }

    // account for the reverse order and offset (0 is baselayer)
    const count = layers.length - 1;
    const src = (result.source.index - count) * -1;
    const dst = (result.destination.index - count) * -1;

    actions.reorder(src, dst);
  };

  const onSelect = (element: MapLayerState<any>) => {
    actions.selectLayer(element.options.name);
  };

  const onDelete = (element: MapLayerState<any>) => {
    actions.deleteLayer(element.options.name);
  };

  const getLayerInfo = (element: MapLayerState<any>) => {
    return element.options.type;
  };

  const onNameChange = (element: MapLayerState<any>, name: string) => {
    element.onChange({ ...element.options, name });
  };

  const isFrame = (element: MapLayerState<any>) => {
    return element instanceof FrameState;
  };

  const selection = selected ? [layers[selected]?.getName()] : [];

  return (
    <>
      <Container>
        <AddLayerButton
          onChange={(v) => actions.addlayer(v.value!)}
          options={geomapLayerRegistry.selectOptions(undefined, dataLayerFilter).options}
          label={'Add layer'}
        />
      </Container>
      <br />

      <LayerDragDropList
        layers={layers}
        getLayerInfo={getLayerInfo}
        onDragEnd={onDragEnd}
        onSelect={onSelect}
        onDelete={onDelete}
        selection={selection}
        isFrame={isFrame}
        excludeBaseLayer
        onNameChange={onNameChange}
        verifyLayerNameUniqueness={actions.canRename}
      />
    </>
  );
};
