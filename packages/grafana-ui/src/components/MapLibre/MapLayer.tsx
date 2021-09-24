import { AnyLayer } from 'maplibre-gl';
import React, { useMemo } from 'react';
import { useMaplibreUIEffect } from './hooks';
import { pickHandlers, createListeners } from './utils';
import { OnLayerEventHandlers, MaplibreLayerEventHandler } from './types';

export type MapLayerProps = AnyLayer &
  Partial<OnLayerEventHandlers<AnyLayer>> & {
    onLoad?: MaplibreLayerEventHandler<AnyLayer, any>;
  };

export const MapLayer: React.FC<MapLayerProps> = (props) => {
  const { id, onLoad, children, ...rest } = props;

  const [onHandlers, onceHandlers, layer] = useMemo(() => pickHandlers(rest), [rest]);
  // layer properties to trigger an effect
  // https://docs.maplibre.com/maplibre-gl-js/style-spec/layers/
  // @ts-ignore
  const { type, paint } = layer;

  useMaplibreUIEffect(
    ({ map, maplibre }) => {
      const exists = map.getLayer(id);
      if (exists) {
        return;
      }
      map.addLayer({
        id,
        ...layer,
      });

      if (onLoad) {
        onLoad({ map, maplibre, props });
      }
    },
    [id, onLoad, type, paint]
  );

  useMaplibreUIEffect(
    ({ map, maplibre }) => {
      const listenerCtx = {
        props,
        map,
        maplibre,
      };
      const onListeners = createListeners(onHandlers, map, listenerCtx, {
        listenType: 'on',
        layerId: id,
      });

      const onceListeners = createListeners(onceHandlers, map, listenerCtx, {
        listenType: 'once',
        layerId: id,
      });

      onListeners.addListeners();
      onceListeners.addListeners();
      return () => {
        onListeners.removeListeners();
        onceListeners.removeListeners();
      };
    },
    [id, onHandlers, onceHandlers]
  );

  if (!children) {
    return null;
  }
  return <>{children}</>;
};
