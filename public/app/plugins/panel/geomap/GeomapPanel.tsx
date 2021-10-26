import React, { Component, ReactNode } from 'react';
import { DEFAULT_BASEMAP_CONFIG, defaultBaseLayer, geomapLayerRegistry } from './layers/registry';
import { Map, MapBrowserEvent, View } from 'ol';
import Attribution from 'ol/control/Attribution';
import Zoom from 'ol/control/Zoom';
import ScaleLine from 'ol/control/ScaleLine';
import BaseLayer from 'ol/layer/Base';
import { defaults as interactionDefaults } from 'ol/interaction';
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom';

import {
  DataFrame,
  DataHoverClearEvent,
  DataHoverEvent,
  GrafanaTheme,
  MapLayerHandler,
  MapLayerOptions,
  PanelData,
  PanelProps,
} from '@grafana/data';
import { config } from '@grafana/runtime';

import { ControlsOptions, GeomapPanelOptions, ImageLayerConfig, MapViewConfig } from './types';
import { centerPointRegistry, MapCenterID } from './view';
import {
  addCoordinateTransforms,
  addProjection,
  fromLonLat,
  get as getProjection,
  toLonLat,
  transform,
  transformExtent,
} from 'ol/proj';
import Projection from 'ol/proj/Projection';
import { Coordinate, rotate } from 'ol/coordinate';
import { css } from '@emotion/css';
import { Portal, stylesFactory, VizTooltipContainer } from '@grafana/ui';
import { GeomapOverlay, OverlayProps } from './GeomapOverlay';
import { DebugOverlay } from './components/DebugOverlay';
import { getGlobalStyles } from './globalStyles';
import { Global } from '@emotion/react';
import { GeomapHoverFeature, GeomapHoverPayload } from './event';
import { DataHoverView } from './components/DataHoverView';
import { ExtensionTooltipRender } from './tooltip';
import ImageLayer from 'ol/layer/Image';
import Static from 'ol/source/ImageStatic';
import { getCenter } from 'ol/extent';

interface MapLayerState {
  config: MapLayerOptions;
  handler: MapLayerHandler;
  layer: BaseLayer; // used to add|remove
}

// Allows multiple panels to share the same view instance
let sharedView: View | undefined = undefined;
export let lastGeomapPanelInstance: GeomapPanel | undefined = undefined;

type Props = PanelProps<GeomapPanelOptions>;
interface State extends OverlayProps {
  ttip?: GeomapHoverPayload;
  customTooltipRender?: boolean;
}

export class GeomapPanel extends Component<Props, State> {
  globalCSS = getGlobalStyles(config.theme2);

  counter = 0;
  map?: Map;
  basemap?: BaseLayer;
  layers: MapLayerState[] = [];
  currentImageLayer?: BaseLayer;
  mouseWheelZoom?: MouseWheelZoom;
  style = getStyles(config.theme);
  hoverPayload: GeomapHoverPayload = { point: {}, pageX: -1, pageY: -1 };
  readonly hoverEvent = new DataHoverEvent(this.hoverPayload);
  tooltipRender = (
    frame?: DataFrame,
    rowIndex?: number,
    columnIndex?: number,
    point?: Record<string, any>
  ): React.ReactNode => {
    return (
      <ExtensionTooltipRender
        data={this.props.data.series}
        frame={frame}
        rowIndex={rowIndex}
        columnIndex={columnIndex}
        timeZone={this.props.timeZone}
        timeRange={this.props.timeRange}
        tooltipOptions={this.props.options.tooltips}
        theme={config.theme2}
        point={point}
      />
    );
  };

  constructor(props: Props) {
    super(props);
    const customTooltipRender =
      props.options.tooltips && props.options.tooltips.extensions && props.options.tooltips.extensions.length > 0;
    this.state = { customTooltipRender };
  }

  componentDidMount() {
    lastGeomapPanelInstance = this;
  }

  shouldComponentUpdate(nextProps: Props) {
    if (!this.map) {
      return true; // not yet initalized
    }

    // Check for resize
    if (this.props.height !== nextProps.height || this.props.width !== nextProps.width) {
      this.map.updateSize();
    }

    // External configuration changed
    let layersChanged = false;
    if (this.props.options !== nextProps.options) {
      layersChanged = this.optionsChanged(nextProps.options);
    }

    // External data changed
    if (layersChanged || this.props.data !== nextProps.data) {
      this.dataChanged(nextProps.data);
    }

    return true; // always?
  }

  /**
   * Called when the panel options change
   */
  optionsChanged(options: GeomapPanelOptions): boolean {
    let layersChanged = false;
    const oldOptions = this.props.options;
    console.log('options changed!', options);

    if (options.view !== oldOptions.view) {
      console.log('View changed');
      this.map!.setView(this.initMapView(options.view));
    }

    if (options.controls !== oldOptions.controls) {
      console.log('Controls changed');
      this.initControls(options.controls ?? { showZoom: true, showAttribution: true });
    }

    if (options.basemap !== oldOptions.basemap) {
      console.log('Basemap changed');
      this.initBasemap(options.basemap);
      layersChanged = true;
    }

    if (options.imageLayer !== oldOptions.imageLayer) {
      console.log('image layer changed');
      this.initImageLayer(options.imageLayer); // async
      layersChanged = true;
    }

    if (options.layers !== oldOptions.layers || layersChanged) {
      console.log('layers changed');
      this.initLayers(options.layers ?? []); // async
      layersChanged = true;
    }

    const customTooltipRender =
      options.tooltips && options.tooltips.extensions && options.tooltips.extensions.length > 0;
    this.setState({ customTooltipRender });
    return layersChanged;
  }

  /**
   * Called when PanelData changes (query results etc)
   */
  dataChanged(data: PanelData) {
    for (const state of this.layers) {
      if (state.handler.update) {
        state.handler.update(data);
      }
    }
  }

  initMapRef = async (div: HTMLDivElement) => {
    if (this.map) {
      this.map.dispose();
    }

    if (!div) {
      this.map = (undefined as unknown) as Map;
      return;
    }
    const { options } = this.props;
    this.map = new Map({
      view: this.initMapView(options.view),
      pixelRatio: 1, // or zoom?
      layers: [], // loaded explicitly below
      controls: [],
      target: div,
      interactions: interactionDefaults({
        mouseWheelZoom: false, // managed by initControls
      }),
    });
    this.mouseWheelZoom = new MouseWheelZoom();
    this.map.addInteraction(this.mouseWheelZoom);
    this.initControls(options.controls);
    this.initBasemap(options.basemap);
    this.initImageLayer(options.imageLayer);
    await this.initLayers(options.layers);
    this.forceUpdate(); // first render

    // Tooltip listener
    this.map.on('pointermove', this.pointerMoveListener);
    this.map.getViewport().addEventListener('mouseout', (evt) => {
      this.props.eventBus.publish(new DataHoverClearEvent({ point: {} }));
    });
  };

  pointerMoveListener = (evt: MapBrowserEvent<UIEvent>) => {
    if (!this.map) {
      return;
    }
    const mouse = evt.originalEvent as any;
    const pixel = this.map.getEventPixel(mouse);
    const hover = toLonLat(this.map.getCoordinateFromPixel(pixel));

    const { hoverPayload } = this;
    hoverPayload.pageX = mouse.pageX;
    hoverPayload.pageY = mouse.pageY;
    hoverPayload.point = {
      lat: hover[1],
      lon: hover[0],
    };
    hoverPayload.data = undefined;
    hoverPayload.columnIndex = undefined;
    hoverPayload.rowIndex = undefined;

    let ttip: GeomapHoverPayload = {} as GeomapHoverPayload;
    const features: GeomapHoverFeature[] = [];
    this.map.forEachFeatureAtPixel(pixel, (feature, layer, geo) => {
      if (!hoverPayload.data) {
        const props = feature.getProperties();
        const frame = props['frame'];
        if (frame) {
          hoverPayload.data = ttip.data = frame as DataFrame;
          hoverPayload.rowIndex = ttip.rowIndex = props['rowIndex'];
        }
      }
      features.push({ feature, layer, geo });
    });
    this.hoverPayload.features = features.length ? features : undefined;
    this.props.eventBus.publish(this.hoverEvent);

    const currentTTip = this.state.ttip;
    if (ttip.data !== currentTTip?.data || ttip.rowIndex !== currentTTip?.rowIndex) {
      this.setState({ ttip: { ...hoverPayload } });
    }
  };

  async initBasemap(cfg: MapLayerOptions) {
    if (!this.map) {
      return;
    }

    if (!cfg?.type || config.geomapDisableCustomBaseLayer) {
      cfg = DEFAULT_BASEMAP_CONFIG;
    }
    const item = geomapLayerRegistry.getIfExists(cfg.type) ?? defaultBaseLayer;
    const handler = await item.create(this.map, cfg, config.theme2);
    const layer = handler.init();
    if (this.basemap) {
      this.map.removeLayer(this.basemap);
      this.basemap.dispose();
    }
    this.basemap = layer;
    this.map.getLayers().insertAt(0, this.basemap);
  }

  rotateProjection = (projection: any, angle: any, extent: any) => {
    function rotateCoordinate(coordinate: any, angle: any, anchor: any) {
      var coord = rotate([coordinate[0] - anchor[0], coordinate[1] - anchor[1]], angle);
      return [coord[0] + anchor[0], coord[1] + anchor[1]];
    }

    function rotateTransform(coordinate: any) {
      return rotateCoordinate(coordinate, angle, getCenter(extent));
    }

    function normalTransform(coordinate: any) {
      return rotateCoordinate(coordinate, -angle, getCenter(extent));
    }

    var normalProjection = getProjection(projection);

    var rotatedProjection = new Projection({
      code: normalProjection.getCode() + ':' + angle.toString() + ':' + extent.toString(),
      units: normalProjection.getUnits(),
      extent: extent,
    });
    addProjection(rotatedProjection);

    addCoordinateTransforms(
      'EPSG:4326',
      rotatedProjection,
      function (coordinate) {
        return rotateTransform(transform(coordinate, 'EPSG:4326', projection));
      },
      function (coordinate) {
        return transform(normalTransform(coordinate), projection, 'EPSG:4326');
      }
    );

    addCoordinateTransforms(
      'EPSG:3857',
      rotatedProjection,
      function (coordinate) {
        return rotateTransform(transform(coordinate, 'EPSG:3857', projection));
      },
      function (coordinate) {
        return transform(normalTransform(coordinate), projection, 'EPSG:3857');
      }
    );

    return rotatedProjection;
  };

  initImageLayer(imageLayer: ImageLayerConfig) {
    if (
      (imageLayer.bottomLeftCoordinates === undefined ||
        imageLayer.topRightCoordinates === undefined ||
        imageLayer.bottomLeftCoordinates.lon === undefined ||
        imageLayer.bottomLeftCoordinates.lat === undefined ||
        imageLayer.topRightCoordinates.lon === undefined ||
        imageLayer.topRightCoordinates.lat === undefined ||
        imageLayer.url === undefined,
      imageLayer.angle === undefined)
    ) {
      // If any of the above is undefined then don't do anything since we need all the data
      console.log(
        `GeoMapPanel - ImageLayer: Some configurations on the image layer object are undefined: ${JSON.stringify(
          imageLayer
        )}`
      );
      return;
    }

    // remove the current image layer from the map if it already exists
    if (this.currentImageLayer !== undefined) {
      this.map!.removeLayer(this.currentImageLayer);
      this.currentImageLayer.dispose();
      console.log('GeoMapPanel - ImageLayer: Removing previous image layer');
    }

    let coordinates = {};
    // @ts-ignore
    coordinates.bottomLeft = [imageLayer.bottomLeftCoordinates.lon, imageLayer.bottomLeftCoordinates.lat];
    // @ts-ignore
    coordinates.topRight = [imageLayer.topRightCoordinates.lon, imageLayer.topRightCoordinates.lat];
    // @ts-ignore
    console.log(
      `GeoMapPanel - ImageLayer: Adding image layer with url: ${imageLayer.url} to coordinates bottom left: ${coordinates.bottomLeft} and top right: ${coordinates.topRight}`
    );

    // @ts-ignore
    let extent = coordinates.bottomLeft.concat(coordinates.topRight);
    extent = transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
    console.log(`GeoMapPanel - ImageLayer: EPSG:3857 equivalent for EPSG:4326 coordinates is: ${extent}`);

    const staticImageLayer = new ImageLayer({
      source: new Static({
        url: imageLayer.url!,
        crossOrigin: '',
        projection: this.rotateProjection('EPSG:3857', (imageLayer.angle * Math.PI) / 180, extent),
        imageExtent: extent,
      }),
    });

    // Add the new image layer to the state and then to the map
    this.currentImageLayer = staticImageLayer;
    this.map!.addLayer(staticImageLayer);
  }

  async initLayers(layers: MapLayerOptions[]) {
    // 1st remove existing layers
    for (const state of this.layers) {
      this.map!.removeLayer(state.layer);
      state.layer.dispose();
    }

    if (!layers) {
      layers = [];
    }

    const legends: React.ReactNode[] = [];
    this.layers = [];
    for (const overlay of layers) {
      const item = geomapLayerRegistry.getIfExists(overlay.type);
      if (!item) {
        console.warn('unknown layer type: ', overlay);
        continue; // TODO -- panel warning?
      }

      const handler = await item.create(this.map!, overlay, config.theme2);
      const layer = handler.init();
      (layer as any).___handler = handler;
      this.map!.addLayer(layer);
      this.layers.push({
        config: overlay,
        layer,
        handler,
      });

      if (handler.legend) {
        legends.push(<div key={`${this.counter++}`}>{handler.legend}</div>);
      }
    }
    this.setState({ bottomLeft: legends });

    // Update data after init layers
    this.dataChanged(this.props.data);
  }

  initMapView(config: MapViewConfig): View {
    let view = new View({
      center: [0, 0],
      zoom: 1,
      showFullExtent: true, // alows zooming so the full range is visiable
    });

    // With shared views, all panels use the same view instance
    if (config.shared) {
      if (!sharedView) {
        sharedView = view;
      } else {
        view = sharedView;
      }
    }

    const v = centerPointRegistry.getIfExists(config.id);
    if (v) {
      let coord: Coordinate | undefined = undefined;
      if (v.lat == null) {
        if (v.id === MapCenterID.Coordinates) {
          coord = [config.lon ?? 0, config.lat ?? 0];
        } else {
          console.log('TODO, view requires special handling', v);
        }
      } else {
        coord = [v.lon ?? 0, v.lat ?? 0];
      }
      if (coord) {
        view.setCenter(fromLonLat(coord));
      }
    }

    if (config.maxZoom) {
      view.setMaxZoom(config.maxZoom);
    }
    if (config.minZoom) {
      view.setMaxZoom(config.minZoom);
    }
    if (config.zoom) {
      view.setZoom(config.zoom);
    }
    return view;
  }

  initControls(options: ControlsOptions) {
    if (!this.map) {
      return;
    }
    this.map.getControls().clear();

    if (options.showZoom) {
      this.map.addControl(new Zoom());
    }

    if (options.showScale) {
      this.map.addControl(
        new ScaleLine({
          units: options.scaleUnits,
          minWidth: 100,
        })
      );
    }

    this.mouseWheelZoom!.setActive(Boolean(options.mouseWheelZoom));

    if (options.showAttribution) {
      this.map.addControl(new Attribution({ collapsed: true, collapsible: true }));
    }

    // Update the react overlays
    let topRight: ReactNode[] = [];
    if (options.showDebug) {
      topRight = [<DebugOverlay key="debug" map={this.map} />];
    }

    this.setState({ topRight });
  }

  render() {
    const { ttip, topRight, bottomLeft, customTooltipRender } = this.state;

    return (
      <>
        <Global styles={this.globalCSS} />
        <div className={this.style.wrap}>
          <div className={this.style.map} ref={this.initMapRef}></div>
          <GeomapOverlay bottomLeft={bottomLeft} topRight={topRight} />
        </div>
        <Portal>
          {ttip && ttip.data && (
            <VizTooltipContainer position={{ x: ttip.pageX, y: ttip.pageY }} offset={{ x: 10, y: 10 }}>
              <DataHoverView tooltipRender={customTooltipRender ? this.tooltipRender : undefined} {...ttip} />
            </VizTooltipContainer>
          )}
        </Portal>
      </>
    );
  }
}

const getStyles = stylesFactory((theme: GrafanaTheme) => ({
  wrap: css`
    position: relative;
    width: 100%;
    height: 100%;
  `,
  map: css`
    position: absolute;
    z-index: 0;
    width: 100%;
    height: 100%;
  `,
}));
