import { PanelPlugin } from '@grafana/data';
import { BaseLayerEditor } from './editor/BaseLayerEditor';
import { DataLayersEditor } from './editor/DataLayersEditor';
import { GeomapPanel } from './GeomapPanel';
import { MapViewEditor } from './editor/MapViewEditor';
import { defaultImageLayerCoordinates, defaultView, GeomapPanelOptions } from './types';
import { mapPanelChangedHandler } from './migrations';
import { defaultMarkersConfig } from './layers/data/markersLayer';
import { DEFAULT_BASEMAP_CONFIG } from './layers/registry';
import { TooltipExtension } from '@grafana/schema';
import { ImageLayerEditor } from './editor/ImageLayerEditor';

export const plugin = new PanelPlugin<GeomapPanelOptions>(GeomapPanel)
  .setNoPadding()
  .setPanelChangeHandler(mapPanelChangedHandler)
  .useFieldConfig()
  .setPanelOptions((builder) => {
    let category = ['Map view'];
    builder.addCustomEditor({
      category,
      id: 'view',
      path: 'view',
      name: 'Initial view', // don't show it
      description: 'This location will show when the panel first loads',
      editor: MapViewEditor,
      defaultValue: defaultView,
    });

    builder.addBooleanSwitch({
      category,
      path: 'view.shared',
      description: 'Use the same view across multiple panels.  Note: this may require a dashboard reload.',
      name: 'Share view',
      defaultValue: defaultView.shared,
    });

    builder.addCustomEditor({
      category: ['Base layer'],
      id: 'basemap',
      path: 'basemap',
      name: 'Base layer',
      editor: BaseLayerEditor,
      defaultValue: DEFAULT_BASEMAP_CONFIG,
    });

    builder.addCustomEditor({
      category: ['Data layer'],
      id: 'layers',
      path: 'layers',
      name: 'Data layer',
      editor: DataLayersEditor,
      defaultValue: [defaultMarkersConfig],
    });

    // The image layer section
    category = ['Image layer'];
    builder
      .addTextInput({
        category,
        path: 'imageLayer.url',
        name: 'Image Url',
        description: 'Overlays an image on top of the map',
        settings: {
          placeholder: 'https://avenge.com/image-layer.png',
        },
      })
      .addNumberInput({
        category,
        path: 'imageLayer.angle',
        name: 'Image angle',
        description: 'Defines the angle in which the image will be drawn in the map',
        defaultValue: 0,
      })
      .addBooleanSwitch({
        category,
        path: 'imageLayer.synchronizeMapAngle',
        description:
          'Synchronizes map angle along with image layer angle, this will keep the image on a 0 degrees angle while changing the angle of the map',
        name: 'Synchronize map angle',
        defaultValue: false,
      })
      .addBooleanSwitch({
        category,
        path: 'imageLayer.restrictMapExtent',
        description: 'Restricts map extent to fit size of image layer',
        name: 'Restrict map extent to fit image layer',
        defaultValue: false,
      })
      .addCustomEditor({
        category: category,
        id: 'imageLayer.bottomLeftCoordinates',
        path: 'imageLayer.bottomLeftCoordinates',
        name: 'Bottom left coordinates',
        editor: ImageLayerEditor,
        defaultValue: defaultImageLayerCoordinates,
      })
      .addCustomEditor({
        category: category,
        id: 'imageLayer.topRightCoordinates',
        path: 'imageLayer.topRightCoordinates',
        name: 'Top right coordinates',
        editor: ImageLayerEditor,
        defaultValue: defaultImageLayerCoordinates,
      });

    // The tooltips section
    category = ['Tooltip Extensions'];
    builder
      .addMultiSelect({
        category,
        path: 'tooltips.extensions',
        name: 'Tooltip Extensions',
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
      })
      .addTextInput({
        category,
        path: 'tooltips.dateFormat',
        name: 'Date Time format',
        description: 'Date/time format applied to any extension tooltips',
        defaultValue: 'DD-MM-YYYY',
        settings: {
          placeholder: 'DD-MM-YYYY',
          expandTemplateVars: true,
        },
        showIf: (c, data) => {
          return c.tooltips?.extensions?.includes(TooltipExtension.DateOffset);
        },
      })
      .addBooleanSwitch({
        category,
        path: 'tooltips.titleShowLocation',
        name: 'Show location in title',
        description: 'Show location in title of the tooltip',
        defaultValue: false,
      })
      .addTextInput({
        category,
        path: 'tooltips.title',
        name: 'Tooltip title',
        description: 'Custom tooltip title',
        defaultValue: '',
        settings: {
          placeholder: '',
          expandTemplateVars: true,
        },
      })
      .addTextInput({
        category,
        path: 'tooltips.titleCounterProperty',
        name: 'Show counter property in title',
        description: 'Show the property specified on the nearest counter found at geohash in the title of the tooltip',
        defaultValue: '',
        settings: {
          placeholder: 'name, address.line1, address.line2, address.singleLine',
          expandTemplateVars: true,
        },
        showIf: (c, data) => {
          return c.tooltips?.extensions && c.tooltips?.extensions?.length > 0;
        },
      });

    // The controls section
    category = ['Map controls'];
    builder
      .addBooleanSwitch({
        category,
        path: 'controls.showZoom',
        description: 'show buttons in the upper left',
        name: 'Show zoom control',
        defaultValue: true,
      })
      .addBooleanSwitch({
        category,
        path: 'controls.mouseWheelZoom',
        name: 'Mouse wheel zoom',
        defaultValue: true,
      })
      .addBooleanSwitch({
        category,
        path: 'controls.showAttribution',
        name: 'Show attribution',
        description: 'Show the map source attribution info in the lower right',
        defaultValue: true,
      })
      .addBooleanSwitch({
        category,
        path: 'controls.showScale',
        name: 'Show scale',
        description: 'Indicate map scale',
        defaultValue: false,
      })
      .addBooleanSwitch({
        category,
        path: 'controls.showDebug',
        name: 'Show debug',
        description: 'show map info',
        defaultValue: false,
      });
  });
