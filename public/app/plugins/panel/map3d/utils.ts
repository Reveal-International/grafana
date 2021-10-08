import { DataFrame, Field, getLocale, PanelProps } from '@grafana/data';
import { decodeGeohash } from '../geomap/utils/geohash';
import { Map3dPanelOptions } from './types';

export function stringHash(s: string): number {
  let hash = 0;
  if (s.length === 0) {
    return hash;
  }
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

export function objectHash(o: any): number {
  return stringHash(JSON.stringify(o));
}

export interface Column {
  index: number;
  field: Field;
  fieldName: string;
  frame: DataFrame;
  value: number;
  displayValue: string;
  category: number; // 0..n relative to other columns in single row - higher number higher value
}

export interface Row {
  index: number;
  location: [number, number];
  columns: Column[];
  totalValue: number;
  largestValue: number;
  category: number; // 0..n relative to other rows - higher number higher value
}

export interface Rows {
  rows: Row[];
  largestColumnValue: number;
  largestRowTotal: number;
}

/**
 * Series representing a location and its values
 */
export class Series {
  geoHash: string;
  coordinates: [number, number];
  totalValue = 0;
  values: SeriesValues[] = [];
  private largestSeriesValue = -1;

  getAggregatedSeriesValues(): number[] {
    const aggregatedSeriesValues: number[] = [];

    if (this.values) {
      for (let i = 0; i < this.values.length; i++) {
        const seriesValues: SeriesValues = this.values[i];

        for (let x = 0; x < seriesValues.values.length; x++) {
          const value = seriesValues.values[x];
          aggregatedSeriesValues[x] === undefined
            ? (aggregatedSeriesValues[x] = value)
            : (aggregatedSeriesValues[x] += value);
        }
      }
    }

    return aggregatedSeriesValues;
  }

  getLargestSeriesValue(): number {
    if (this.largestSeriesValue === -1) {
      this.largestSeriesValue = Math.max(...this.getAggregatedSeriesValues());
    }
    return this.largestSeriesValue;
  }
}

/**
 * Values of a series with its corresponding datetime
 */
export class SeriesValues {
  datetime: number;
  totalValue = 0;
  values: number[] = [];
}

export function dataFrameToSeries(props: PanelProps<Map3dPanelOptions>): Series[] {
  const series: DataFrame[] = props.data.series;
  const seriesByGeoHash: Map<string, Series> = new Map();

  // 'series' are spread, for example, if we have 2 KPIs for a particular GeoHash, we will see 2 series with same GeoHash
  // and its series will be a KPI with its datetimes and values

  //@ts-ignore
  // TODO use this
  const metrics: string[] = props.data.request.targets[0].metrics;

  if (series) {
    for (let i = 0; i < series.length; i++) {
      const serie: DataFrame = series[i];
      //@ts-ignore
      const geoHash: string = serie.name;
      //@ts-ignore
      const coordinates: [number, number] = decodeGeohash(geoHash);

      //@ts-ignore
      const datetimes: [] = serie.fields[0].values.buffer;
      //@ts-ignore
      const values: [] = serie.fields[1].values.buffer;

      for (let datetimeIndex = 0; datetimeIndex < datetimes.length; datetimeIndex++) {
        const datetime: number = datetimes[datetimeIndex];
        const value: number = values[datetimeIndex];

        if (seriesByGeoHash.has(geoHash)) {
          let hasDatetime = false;
          //@ts-ignore
          const existingSeries: Series = seriesByGeoHash.get(geoHash);
          existingSeries.values.forEach((existingSeriesValue: SeriesValues) => {
            if (existingSeriesValue.datetime === datetime) {
              //@ts-ignore
              existingSeriesValue.values.push(value);
              existingSeriesValue.totalValue += value;
              hasDatetime = true;
            }
          });

          if (!hasDatetime) {
            // The series exists but does not have this datetime yet
            const seriesValues: SeriesValues = new SeriesValues();
            seriesValues.datetime = datetime;
            seriesValues.values.push(value);
            seriesValues.totalValue += value;
            existingSeries.values.push(seriesValues);
          }

          existingSeries.totalValue += value;
        } else {
          const newSeries: Series = new Series();
          newSeries.geoHash = geoHash;
          newSeries.coordinates = coordinates;
          newSeries.totalValue += value;

          const newSeriesValues: SeriesValues = new SeriesValues();
          newSeriesValues.datetime = datetime;
          newSeriesValues.values.push(value);
          newSeriesValues.totalValue += value;
          newSeries.values.push(newSeriesValues);

          seriesByGeoHash.set(geoHash, newSeries);
        }
      }
    }
  }

  return Array.from(seriesByGeoHash.values());
}

export function formatNumber(number: number, options = {}) {
  return new Intl.NumberFormat(getLocale(), options).format(number);
}
