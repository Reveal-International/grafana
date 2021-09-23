import { OnEventListener, LayerEvents, OnEventHandlerRaw, OnEventHandler, EventHandlerContext } from './types';
import { Map, Marker } from 'maplibre-gl';

interface ListenerOptions {
  listenType: 'on' | 'once';
  layerId?: string;
}

export function createListeners<P>(
  onHandlers: OnEventListener<P>,
  target: Map | Marker,
  ctx: EventHandlerContext<P>,
  opts: ListenerOptions = { listenType: 'on' }
) {
  const handlers = [] as Array<[LayerEvents, OnEventHandlerRaw]>;

  const { listenType, layerId } = opts;

  for (const handlerType in onHandlers) {
    const type = handlerType.replace(listenType, '').toLowerCase() as LayerEvents;

    const handler: OnEventHandlerRaw = (ev: any) => {
      // @ts-ignore
      const customHandler = onHandlers[handlerType] as OnEventHandler<any>;

      return customHandler(ctx, ev);
    };

    handlers.push([type, handler]);
  }

  const addListeners = () => {
    handlers.forEach(([type, handler]) => {
      if (opts.layerId) {
        return (target as Map)[listenType](type, opts.layerId, handler);
      }
      return target[listenType](type, handler);
    });
  };

  const removeListeners = () => {
    handlers.forEach(([type, handler]) => {
      if (layerId) {
        return (target as Map).off(type, layerId, handler);
      }
      return target.off(type, handler);
    });
  };

  return { addListeners, removeListeners };
}

const onType = 'on';
const onceType = 'once';
export function pickHandlers<T>(props: T) {
  const onHandlers = {} as OnEventListener<T>;
  const onceHandlers = {} as OnEventListener<T>;
  const rest = {};
  for (const key in props) {
    if (key.includes(onceType)) {
      // @ts-ignore
      onceHandlers[key] = props[key];
    } else if (key.includes(onType)) {
      // @ts-ignore
      onHandlers[key] = props[key];
    } else {
      // @ts-ignore
      rest[key] = props[key];
    }
  }

  return [onHandlers, onceHandlers, rest] as [OnEventListener<T>, OnEventListener<T>, T];
}
