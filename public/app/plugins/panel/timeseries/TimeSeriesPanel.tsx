import { DataFrame, Field, getDisplayProcessor, getFieldDisplayName, PanelProps } from '@grafana/data';
import { config } from '@grafana/runtime';
import { TooltipDisplayMode, TooltipExtension } from '@grafana/ui';
import { usePanelContext, TimeSeries, TooltipPlugin, ZoomPlugin, RSupport, useTheme2 } from '@grafana/ui';
import { getFieldLinksForExplore } from 'app/features/explore/utils/links';
import React, { useCallback, useMemo } from 'react';
import { AnnotationsPlugin } from './plugins/AnnotationsPlugin';
import { ContextMenuPlugin } from './plugins/ContextMenuPlugin';
import { ExemplarsPlugin } from './plugins/ExemplarsPlugin';
import { TimeSeriesOptions } from './types';
import { prepareGraphableFields } from './utils';
import { AnnotationEditorPlugin } from './plugins/AnnotationEditorPlugin';
import { ExtensionTooltipRender } from './tooltip';

interface TimeSeriesPanelProps extends PanelProps<TimeSeriesOptions> {}

export const TimeSeriesPanel: React.FC<TimeSeriesPanelProps> = ({
  data,
  timeRange,
  timeZone,
  width,
  height,
  options,
  onChangeTimeRange,
  replaceVariables,
}) => {
  const { sync, canAddAnnotations } = usePanelContext();

  const theme = useTheme2();

  const getFieldLinks = (field: Field, rowIndex: number) => {
    return getFieldLinksForExplore({ field, rowIndex, range: timeRange });
  };

  const { frames, warn } = useMemo(() => prepareGraphableFields(data?.series, config.theme2), [data]);

  const extensionTooltipRender = useCallback(
    (alignedData: DataFrame, seriesIdx: number | null, datapointIdx: number | null) => {
      return (
        <ExtensionTooltipRender
          data={frames ?? []}
          alignedData={alignedData}
          seriesIdx={seriesIdx}
          datapointIdx={datapointIdx}
          timeRange={timeRange}
          timeZone={timeZone}
          tooltipOptions={options.tooltip}
        />
      );
    },
    [frames, timeRange, timeZone, options.tooltip]
  );

  // Whether to use our special tooltip if we have a time offset format
  const useExtensionTooltipRender = useMemo(() => {
    return options.tooltip.extensions?.includes(TooltipExtension.DateOffset);
  }, [options.tooltip.extensions]);

  const extensionLegendLabelResolver = (field: Field, value: any, data: DataFrame[]) => {
    const fieldFmt = field.display || getDisplayProcessor({ field, timeZone: timeZone, theme });
    const offset = fieldFmt(field.config.timeOffset).text;
    const defaultLabel = getFieldDisplayName(field, value, data);
    return defaultLabel + ' ' + RSupport.formatDateRange(timeRange, timeZone, offset, options.legend.dateFormat);
  };

  // Whether to use our special legend resolver if we have a time offset format
  const useExtensionLegendLabelResolver = useMemo(() => {
    return options.legend.dateFormat;
  }, [options.legend.dateFormat]);

  if (!frames || warn) {
    return (
      <div className="panel-empty">
        <p>{warn ?? 'No data found in response'}</p>
      </div>
    );
  }

  const enableAnnotationCreation = Boolean(canAddAnnotations && canAddAnnotations());
  return (
    <TimeSeries
      frames={frames}
      structureRev={data.structureRev}
      timeRange={timeRange}
      timeZone={timeZone}
      width={width}
      height={height}
      legendLabelResolver={useExtensionLegendLabelResolver ? extensionLegendLabelResolver : undefined}
      legend={options.legend}
    >
      {(config, alignedDataFrame) => {
        return (
          <>
            <ZoomPlugin config={config} onZoom={onChangeTimeRange} />
            {options.tooltip.mode === TooltipDisplayMode.None || (
              <TooltipPlugin
                data={alignedDataFrame}
                config={config}
                mode={options.tooltip.mode}
                sync={sync}
                renderTooltip={useExtensionTooltipRender ? extensionTooltipRender : undefined}
                timeZone={timeZone}
              />
            )}
            {/* Renders annotation markers*/}
            {data.annotations && (
              <AnnotationsPlugin annotations={data.annotations} config={config} timeZone={timeZone} />
            )}
            {/* Enables annotations creation*/}
            <AnnotationEditorPlugin data={alignedDataFrame} timeZone={timeZone} config={config}>
              {({ startAnnotating }) => {
                return (
                  <ContextMenuPlugin
                    data={alignedDataFrame}
                    config={config}
                    timeZone={timeZone}
                    replaceVariables={replaceVariables}
                    defaultItems={
                      enableAnnotationCreation
                        ? [
                            {
                              items: [
                                {
                                  label: 'Add annotation',
                                  ariaLabel: 'Add annotation',
                                  icon: 'comment-alt',
                                  onClick: (e, p) => {
                                    if (!p) {
                                      return;
                                    }
                                    startAnnotating({ coords: p.coords });
                                  },
                                },
                              ],
                            },
                          ]
                        : []
                    }
                  />
                );
              }}
            </AnnotationEditorPlugin>
            {data.annotations && (
              <ExemplarsPlugin
                config={config}
                exemplars={data.annotations}
                timeZone={timeZone}
                getFieldLinks={getFieldLinks}
              />
            )}
          </>
        );
      }}
    </TimeSeries>
  );
};
