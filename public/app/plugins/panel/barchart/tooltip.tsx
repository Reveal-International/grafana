import {
  DataFrame,
  FALLBACK_COLOR,
  FieldType,
  formattedValueToString,
  getDisplayProcessor,
  getFieldDisplayName,
  TimeRange,
} from '@grafana/data';
import {
  RSeriesTable,
  RSeriesTableRowProps,
  RSupport,
  TooltipDisplayMode,
  useTheme2,
  VizTooltipOptions,
} from '@grafana/ui';
import React from 'react';
import { TooltipExtension } from '@grafana/ui';

export interface ExtensionTooltipRenderProps {
  data: DataFrame[];
  alignedData: DataFrame;
  seriesIdx: number | null;
  datapointIdx: number | null;
  timeZone: string;
  timeRange: TimeRange;
  tooltipOptions: VizTooltipOptions;
}

export function ExtensionTooltipRender(props: ExtensionTooltipRenderProps) {
  const theme = useTheme2();

  let xField = props.alignedData.fields[0];
  if (!xField) {
    return null;
  }
  const xFieldFmt = xField.display || getDisplayProcessor({ field: xField, timeZone: props.timeZone, theme });
  const xVal = xFieldFmt(xField!.values.get(props.datapointIdx!)).text;

  if (props.tooltipOptions.mode === TooltipDisplayMode.Single && props.seriesIdx !== null) {
    const field = props.alignedData.fields[props.seriesIdx];

    if (!field) {
      return null;
    }

    const fieldFmt = field.display || getDisplayProcessor({ field, timeZone: props.timeZone, theme });
    const display = fieldFmt(field.values.get(props.datapointIdx!));
    const offset = fieldFmt(field.config.timeOffset).text;

    return (
      <RSeriesTable
        series={[
          {
            color: display.color || FALLBACK_COLOR,
            label1: RSupport.formatDateRange(props.timeRange, props.timeZone, offset, props.tooltipOptions.dateFormat),
            label2: getFieldDisplayName(field, props.alignedData),
            value: display ? formattedValueToString(display) : null,
          },
        ]}
        title={xVal}
      />
    );
  } else if (props.tooltipOptions.mode === TooltipDisplayMode.Multi) {
    let series: RSeriesTableRowProps[] = [];
    for (let i = 0; i < props.data.length; i++) {
      const frame = props.data[i];
      const xField = frame.fields[0];
      for (let f = 1; f < frame.fields.length; f++) {
        const field = frame.fields[f];
        if (
          !field ||
          field === xField ||
          field.type === FieldType.time ||
          field.type !== FieldType.number ||
          field.config.custom?.hideFrom?.tooltip ||
          field.config.custom?.hideFrom?.viz
        ) {
          continue;
        }

        const fieldFmt = field.display || getDisplayProcessor({ field, timeZone: props.timeZone, theme });
        const fieldValue = field.values.get(props.datapointIdx!) as number;
        const delta = RSupport.calculateFieldDelta(fieldFmt, props.data, field, props.datapointIdx!);
        const display = fieldFmt(fieldValue);
        const offset = fieldFmt(field.config.timeOffset).text;
        series.push({
          color: display.color || FALLBACK_COLOR,
          label1: RSupport.formatDateRange(props.timeRange, props.timeZone, offset, props.tooltipOptions.dateFormat),
          label2: getFieldDisplayName(field, frame),
          value: display ? formattedValueToString(display) : null,
          value1: props.tooltipOptions.extensions?.includes(TooltipExtension.DeltaNumeric)
            ? delta.deltaString
            : undefined,
          value2: props.tooltipOptions.extensions?.includes(TooltipExtension.DeltaPercent)
            ? delta.percentString
            : undefined,
          img: props.tooltipOptions.extensions?.includes(TooltipExtension.DeltaTrend) ? delta.trendImg : undefined,
          isActive: props.seriesIdx === i,
        });
      }
    }
    return <RSeriesTable series={series} title={xVal} />;
  } else {
    return null;
  }
}
