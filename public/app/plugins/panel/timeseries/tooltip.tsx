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
  DeltaCalculation,
  RSeriesTable,
  RSeriesTableRowProps,
  RSupport,
  TooltipDisplayMode,
  useTheme2,
  VizTooltipOptions,
} from '@grafana/ui';
import React from 'react';
import { TooltipExtension } from '@grafana/schema';

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

  if (props.tooltipOptions.mode === TooltipDisplayMode.Single) {
    const field = props.alignedData!.fields[props.seriesIdx!];
    if (!field) {
      return null;
    }
    const xField = props.alignedData.fields[0]; // assumption first field is time..
    const xFieldValue = xField.values.get(props.datapointIdx!);
    // Format date with any current field offset set!
    const xFieldFormatted = RSupport.formatDate(
      xFieldValue,
      props.timeZone,
      field.config.timeOffset,
      props.tooltipOptions.dateFormat
    );

    const fieldFmt = field.display || getDisplayProcessor({ field, timeZone: props.timeZone, theme });
    const display = fieldFmt(field.values.get(props.datapointIdx!));

    return (
      <RSeriesTable
        series={[
          {
            color: display.color || FALLBACK_COLOR,
            label1: getFieldDisplayName(field, props.alignedData),
            value: display ? formattedValueToString(display) : null,
          },
        ]}
        title={xFieldFormatted}
      />
    );
  } else if (props.tooltipOptions.mode === TooltipDisplayMode.Multi) {
    let series: RSeriesTableRowProps[] = [];
    let baseFieldValue = null;
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

        const xFieldValue = xField.values.get(props.datapointIdx!);
        // Format date with any current field offset set!
        const xFieldFormatted = RSupport.formatDate(
          xFieldValue,
          props.timeZone,
          field.config.timeOffset,
          props.tooltipOptions.dateFormat
        );

        const fieldValue = field.values.get(props.datapointIdx!);
        const fieldFmt = field.display || getDisplayProcessor({ field, timeZone: props.timeZone, theme });
        let delta = {} as DeltaCalculation;
        if (baseFieldValue === null) {
          baseFieldValue = fieldValue;
        } else {
          delta = RSupport.calculateDelta(fieldFmt, baseFieldValue, fieldValue);
        }

        const display = field.display!(fieldValue);
        const displayName = getFieldDisplayName(field, frame);

        series.push({
          color: display.color || FALLBACK_COLOR,
          label1: xFieldFormatted,
          label2: displayName,
          value: display ? formattedValueToString(display) : null,
          value1: props.tooltipOptions.extensions?.includes(TooltipExtension.DeltaNumeric)
            ? delta.deltaString
            : undefined,
          value2: props.tooltipOptions.extensions?.includes(TooltipExtension.DeltaPercent)
            ? delta.percentString
            : undefined,
          img: props.tooltipOptions.extensions?.includes(TooltipExtension.DeltaTrend) ? delta.trendImg : undefined,
          isActive: i === props.seriesIdx,
        });
      }
    }
    return <RSeriesTable series={series} />;
  } else {
    return null;
  }
}
