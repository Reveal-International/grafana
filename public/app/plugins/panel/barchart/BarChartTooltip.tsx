import {
  DataFrame,
  dateTimeFormat,
  FALLBACK_COLOR,
  FieldType,
  formattedValueToString,
  getDisplayProcessor,
  getFieldDisplayName,
  TimeRange,
} from '@grafana/data';
import { RSeriesTable, RSeriesTableRowProps, TooltipDisplayMode, useTheme2, VizTooltipOptions } from '@grafana/ui';
/* eslint-disable id-blacklist, no-restricted-imports, @typescript-eslint/ban-types */
import moment, { DurationInputArg2 } from 'moment';
import React from 'react';

export interface BarChartTooltipProps {
  data: DataFrame[];
  alignedData: DataFrame;
  seriesIdx: number | null;
  datapointIdx: number | null;
  timeZone: string;
  timeRange: TimeRange;
  tooltipOptions: VizTooltipOptions;
}

export function BarChartTooltip(props: BarChartTooltipProps) {
  const theme = useTheme2();

  const dateRange = (timeOffset: string): string => {
    let start = props.timeRange.from.valueOf();
    let finish = props.timeRange.to.valueOf();
    if (timeOffset) {
      const parts = timeOffset.match(/^(\d+)([s|m|h|d|w|M|y])$/);
      if (parts?.length === 3) {
        const duration = moment.duration(parseInt(parts[1], 10), parts[2] as DurationInputArg2);
        start = moment(start).subtract(duration).valueOf();
        finish = moment(finish).subtract(duration).valueOf();
      }
    }
    const startStr = dateTimeFormat(start, {
      format: props.tooltipOptions.timeFormat,
      timeZone: props.timeZone,
    });
    const finishStr = dateTimeFormat(finish, {
      format: props.tooltipOptions.timeFormat,
      timeZone: props.timeZone,
    });
    // TODO maybe more styly?
    const range = startStr + ' to ' + finishStr;
    return range;
  };

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
            label1: dateRange(offset),
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
        const display = fieldFmt(field.values.get(props.datapointIdx!));
        const offset = fieldFmt(field.config.timeOffset).text;
        series.push({
          color: display.color || FALLBACK_COLOR,
          label1: dateRange(offset),
          label2: getFieldDisplayName(field, frame),
          value: display ? formattedValueToString(display) : null,
          isActive: props.seriesIdx === i,
        });
      }
    }
    return <RSeriesTable series={series} title={xVal} />;
  } else {
    return null;
  }
}
