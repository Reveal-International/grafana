import React, { useCallback, useMemo } from 'react';
import { TooltipDisplayMode, StackingMode, TooltipExtension } from '@grafana/schema';
import { DataFrame, PanelProps, TimeRange, VizOrientation } from '@grafana/data';
import { TooltipPlugin, useTheme2 } from '@grafana/ui';
import { BarChartOptions } from './types';
import { BarChart } from './BarChart';
import { prepareGraphableFrames } from './utils';
import { ExtensionTooltipRender } from './tooltip';

interface Props extends PanelProps<BarChartOptions> {}

/**
 * @alpha
 */
export const BarChartPanel: React.FunctionComponent<Props> = ({
  data,
  options,
  width,
  height,
  timeZone,
  timeRange,
}) => {
  const theme = useTheme2();

  const { frames, warn } = useMemo(() => prepareGraphableFrames(data?.series, theme, options.stacking), [
    data,
    theme,
    options.stacking,
  ]);
  const orientation = useMemo(() => {
    if (!options.orientation || options.orientation === VizOrientation.Auto) {
      return width < height ? VizOrientation.Horizontal : VizOrientation.Vertical;
    }

    return options.orientation;
  }, [width, height, options.orientation]);

  // Force 'multi' tooltip setting or stacking mode
  const tooltip = useMemo(() => {
    if (options.stacking === StackingMode.Normal || options.stacking === StackingMode.Percent) {
      return { ...options.tooltip, mode: TooltipDisplayMode.Multi };
    }
    return options.tooltip;
  }, [options.tooltip, options.stacking]);

  const extensionTooltipRender = useCallback(
    (alignedData: DataFrame, seriesIdx: number | null, datapointIdx: number | null) => {
      return (
        <ExtensionTooltipRender
          data={frames!}
          alignedData={alignedData}
          seriesIdx={seriesIdx}
          datapointIdx={datapointIdx}
          timeRange={timeRange}
          timeZone={timeZone}
          tooltipOptions={options.tooltip}
        />
      );
    },
    [frames, options.tooltip, timeRange, timeZone]
  );

  // Whether to use our extension tooltip render
  const useExtensionTooltipRender = useMemo(() => {
    return options.tooltip.extensions?.includes(TooltipExtension.DateOffset);
  }, [options.tooltip.extensions]);

  if (!frames || warn) {
    return (
      <div className="panel-empty">
        <p>{warn ?? 'No data found in response'}</p>
      </div>
    );
  }

  return (
    <BarChart
      frames={frames}
      timeZone={timeZone}
      timeRange={({ from: 1, to: 1 } as unknown) as TimeRange} // HACK
      structureRev={data.structureRev}
      width={width}
      height={height}
      {...options}
      orientation={orientation}
    >
      {(config, alignedFrame) => {
        return (
          <TooltipPlugin
            data={alignedFrame}
            config={config}
            mode={tooltip.mode}
            timeZone={timeZone}
            renderTooltip={useExtensionTooltipRender ? extensionTooltipRender : undefined}
          />
        );
      }}
    </BarChart>
  );
};
