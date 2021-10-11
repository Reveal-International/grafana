import React, { useEffect, useState } from 'react';
import {
  DataFrame,
  FALLBACK_COLOR,
  FieldType,
  formattedValueToString,
  getDisplayProcessor,
  getFieldDisplayName,
  GrafanaTheme2,
  TimeRange,
} from '@grafana/data';
import { TooltipExtension } from '@grafana/schema';
import { RSeriesTable, RSeriesTableRowProps, RSupport } from '@grafana/ui';
import { TooltipOptions } from './types';
import { decodeGeohash } from './utils/geohash';
import { FetchResponse, getBackendSrv } from '@grafana/runtime';
import { map } from 'rxjs/operators';

export interface ExtensionTooltipRenderProps {
  data?: DataFrame[];
  frame?: DataFrame;
  rowIndex?: number | null;
  columnIndex?: number | null;
  timeZone: string;
  timeRange: TimeRange;
  tooltipOptions: TooltipOptions;
  theme: GrafanaTheme2;
  point?: Record<string, any>;
}

export function ExtensionTooltipRender(props: ExtensionTooltipRenderProps) {
  const [title, setTitle] = useState<any>('');
  const [subTitle1, setSubTitle1] = useState<any>('');
  const [subTitle2, setSubTitle2] = useState<any>('');
  useEffect(() => {
    const locationField = props.frame?.fields[0]; // Assumption is location
    const geoHash = locationField ? locationField.values.get(props.rowIndex!) : undefined;
    const latLng = locationField ? decodeGeohash(geoHash) : undefined;
    if (props.tooltipOptions.title) {
      setTitle(props.tooltipOptions.title);
    }
    if (latLng && props.tooltipOptions.titleShowLocation) {
      setSubTitle2(`Latitude:${latLng![0]}, Longitude:${latLng![1]}, GeoHash:${geoHash}`);
    }
    // and get the address
    if (props.tooltipOptions.titleCounterProperty) {
      getBackendSrv()
        .fetch({
          method: 'GET',
          url: '/avenge/api/_/geocounter/' + geoHash,
          params: { singleCounter: true },
          showErrorAlert: false,
        })
        .pipe(map((response: FetchResponse) => response.data))
        .toPromise()
        .then((r) => {
          // @ts-ignore
          const vars = { ...r, ...r.address };
          const title = vars[props.tooltipOptions.titleCounterProperty!];
          setSubTitle1(title);
        })
        .catch((r) => {
          // do nowt...
        });
    }
  }, [
    props.frame?.fields,
    props.rowIndex,
    props.tooltipOptions.title,
    props.tooltipOptions.titleCounterProperty,
    props.tooltipOptions.titleShowLocation,
  ]); // deliberately no dependencies so runs once

  if (!props.data) {
    return null;
  }

  let series: RSeriesTableRowProps[] = [];
  for (let i = 0; i < props.data.length; i++) {
    const frame = props.data[i];
    const xField = frame.fields[0]; // Assumption is location
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

      const fieldFmt = field.display || getDisplayProcessor({ field, timeZone: props.timeZone, theme: props.theme });
      const fieldValue = field.values.get(props.rowIndex!) as number;
      const delta = RSupport.calculateFieldDelta(fieldFmt, props.data, field, props.rowIndex!);
      const display = fieldFmt(fieldValue);
      const offset = fieldFmt(field.config.timeOffset).text;
      series.push({
        color: display.color || FALLBACK_COLOR,
        label1: RSupport.formatDateRange(props.timeRange, props.timeZone, offset, props.tooltipOptions.dateFormat),
        label2: getFieldDisplayName(field, frame),
        value: display ? formattedValueToString(display) : null,
        value1: props.tooltipOptions?.extensions?.includes(TooltipExtension.DeltaNumeric)
          ? delta.deltaString
          : undefined,
        value2: props.tooltipOptions?.extensions?.includes(TooltipExtension.DeltaPercent)
          ? delta.percentString
          : undefined,
        img: props.tooltipOptions?.extensions?.includes(TooltipExtension.DeltaTrend) ? delta.trendImg : undefined,
        isActive: props.rowIndex === i,
      });
    }
  }
  return <RSeriesTable title={title} subtitle1={subTitle1} subtitle2={subTitle2} series={series} />;
}
