import {
  DataFrame,
  dateTimeFormat,
  FALLBACK_COLOR,
  Field,
  FieldType,
  formattedValueToString,
  getDisplayProcessor,
  getFieldDisplayName,
  TimeRange,
} from '@grafana/data';
import React from 'react';
import { SeriesTable, SeriesTableRowProps, TooltipDisplayMode, useTheme2, VizTooltipOptions } from '@grafana/ui';
/* eslint-disable id-blacklist, no-restricted-imports, @typescript-eslint/ban-types */
import moment, { DurationInputArg2 } from 'moment';

export interface TimeSeriesTooltipProps {
  data: DataFrame[];
  alignedData: DataFrame;
  seriesIdx: number | null;
  datapointIdx: number | null;
  timeZone: string;
  timeRange: TimeRange;
  tooltipOptions: VizTooltipOptions;
}

export function TimeSeriesTooltip(props: TimeSeriesTooltipProps) {
  const theme = useTheme2();

  const formatDate = (field: Field, index: number, timeOffset?: string): string => {
    let fieldValue = field.values.get(index!);
    if (timeOffset) {
      const parts = timeOffset.match(/^(\d+)([s|m|h|d|w|M|y])$/);
      if (parts?.length === 3) {
        const duration = moment.duration(parseInt(parts[1], 10), parts[2] as DurationInputArg2);
        const newValue = moment(fieldValue).subtract(duration).valueOf();
        // New time value
        fieldValue = newValue;
      }
    }
    if (props.tooltipOptions.timeFormat) {
      return dateTimeFormat(fieldValue, {
        format: props.tooltipOptions.timeFormat,
        timeZone: props.timeZone,
      });
    } else {
      const xFieldFmt = field.display || getDisplayProcessor({ field: field, timeZone: props.timeZone, theme });
      return xFieldFmt(fieldValue).text;
    }
  };

  if (props.tooltipOptions.mode === TooltipDisplayMode.Single) {
    const field = props.alignedData!.fields[props.seriesIdx!];
    if (!field) {
      return null;
    }
    const xField = props.alignedData.fields[0]; // assumption first field is time..
    const xFieldFormatted = formatDate(xField, props.datapointIdx!, field.config.timeOffset);

    const fieldFmt = field.display || getDisplayProcessor({ field, timeZone: props.timeZone, theme });
    const display = fieldFmt(field.values.get(props.datapointIdx!));

    return (
      <SeriesTable
        series={[
          {
            color: display.color || FALLBACK_COLOR,
            label: getFieldDisplayName(field, props.alignedData),
            value: display ? formattedValueToString(display) : null,
          },
        ]}
        timestamp={xFieldFormatted}
      />
    );
  } else if (props.tooltipOptions.mode === TooltipDisplayMode.Multi) {
    let series: SeriesTableRowProps[] = [];
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

        const xFieldFormatted = formatDate(xField, props.datapointIdx!, field.config.timeOffset);
        const fieldValue = field.values.get(props.datapointIdx!);
        const display = field.display!(fieldValue);
        const displayName = getFieldDisplayName(field, frame);

        series.push({
          color: display.color || FALLBACK_COLOR,
          label: xFieldFormatted + ' ' + displayName,
          value: display ? formattedValueToString(display) : null,
          isActive: true,
        });
      }
    }
    return <SeriesTable series={series} />;
  } else {
    return null;
  }
}
