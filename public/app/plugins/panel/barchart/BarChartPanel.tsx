import React, { useCallback, useMemo } from 'react';
import { TooltipDisplayMode, StackingMode } from '@grafana/schema';
import { DataFrame, PanelProps, TimeRange, VizOrientation } from '@grafana/data';
import { TooltipPlugin, useTheme2 } from '@grafana/ui';
import { BarChartOptions } from './types';
import { BarChart } from './BarChart';
import { prepareGraphableFrames } from './utils';
import { BarChartTooltip } from './BarChartTooltip';

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

  const renderCustomTooltip = useCallback(
    (alignedData: DataFrame, seriesIdx: number | null, datapointIdx: number | null) => {
      return (
        <BarChartTooltip
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

  // Whether to use our special tooltip if we have a time offset format
  const ourRender = useMemo(() => {
    return options.tooltip.timeFormat;
  }, [options.tooltip.timeFormat]);

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
            renderTooltip={ourRender ? renderCustomTooltip : undefined}
          />
        );
      }}
    </BarChart>
  );
};
