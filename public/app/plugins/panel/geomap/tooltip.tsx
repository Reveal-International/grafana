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
import { RSeriesTable, RSeriesTableRowProps, RSupport, TooltipExtension } from '@grafana/ui';
import { TooltipOptions } from './types';
import { decodeGeohash } from './utils/geohash';
import { getBackendSrv} from "@grafana/runtime";

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
  useEffect(() => {
    const locationField = props.frame?.fields[0]; // Assumption is location
    const geoHash = locationField ? locationField.values.get(props.rowIndex!) : undefined;
    const latLng = locationField ? decodeGeohash(geoHash) : undefined;
    // TODO in here we can go async to http://localhost:8080/client/_/geocounter/${geoHash}??singleAddress=true
    // and get the address

    if (props.tooltipOptions.titleCounterProperty) {
      getBackendSrv()
        .get('/avenge/api/_/geocounter/' + geoHash, { singleCounter: true })
        .then((r) => {
          // eslint-disable-next-line no-console
          const vars = { ...r, ...r.address };
          const title = vars[props.tooltipOptions.titleCounterProperty!];
          setTitle(<div>{title && <div>{title}</div>}</div>);
        });
    } else if (props.tooltipOptions.titleShowLocation) {
      // Default it? maybe dont do this..
      setTitle(
        <div>
          {geoHash && <div>GeoHash:{geoHash}</div>}
          {latLng && (
            <div>
              Latitude:{latLng![0]}, Longitude:{latLng![1]}
            </div>
          )}
        </div>
      );
    }
  }, []); // deliberately no dependencies so runs once

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
  return <RSeriesTable title={title} series={series} />;
}
