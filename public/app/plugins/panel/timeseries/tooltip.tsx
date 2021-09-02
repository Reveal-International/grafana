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
        let delta = null;
        let deltaPercent = null;
        let trendImg = null;
        if (baseFieldValue === null) {
          baseFieldValue = fieldValue;
        } else {
          delta = fieldValue - baseFieldValue;
          if (fieldValue === baseFieldValue) {
            deltaPercent = '0%';
            trendImg = <img src="public/img/icon_trending_flat.png"></img>;
          } else if (fieldValue > baseFieldValue) {
            trendImg = <img src="public/img/icon_trending_up.png"></img>;
            if (baseFieldValue) {
              deltaPercent = '+' + Math.round((100.0 * (fieldValue - baseFieldValue)) / baseFieldValue) + '%';
            } else {
              deltaPercent = '+100%';
            }
          } else {
            trendImg = <img src="public/img/icon_trending_down.png"></img>;
            if (baseFieldValue) {
              deltaPercent = Math.round((100.0 * (fieldValue - baseFieldValue)) / baseFieldValue) + '%';
            } else {
              deltaPercent = '-100%';
            }
          }
        }

        const display = field.display!(fieldValue);
        const displayName = getFieldDisplayName(field, frame);
        const deltaDisplay = fieldFmt(delta);
        let deltaString = formattedValueToString(deltaDisplay);
        if (delta && delta > 0) {
          deltaString = '+' + deltaString;
        }

        series.push({
          color: display.color || FALLBACK_COLOR,
          label1: xFieldFormatted,
          label2: displayName,
          value: display ? formattedValueToString(display) : null,
          value1: props.tooltipOptions.extensions?.includes(TooltipExtension.DeltaNumeric) ? deltaString : undefined,
          value2: props.tooltipOptions.extensions?.includes(TooltipExtension.DeltaPercent) ? deltaPercent : undefined,
          img: props.tooltipOptions.extensions?.includes(TooltipExtension.DeltaTrend) ? trendImg : undefined,
          isActive: i === props.seriesIdx,
        });
      }
    }
    return <RSeriesTable series={series} />;
  } else {
    return null;
  }
}
