import { DataFrame, Field } from '@grafana/data';
import { decodeGeohash } from '../geomap/utils/geohash';

export function largestValue(field: Field): number {
  let largest = 0;
  for (let valueIndex = 0; valueIndex < field.values.length; valueIndex++) {
    const value = field.values.get(valueIndex);
    if (value > largest) {
      largest = value;
    }
  }
  return largest;
}

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
  field: Field;
  value: number;
}

export interface Row {
  location: [number, number];
  columns: Column[];
  totalValue: number;
}

export interface Rows {
  rows: Row[];
  largestValue: number;
}

export function dataFramesToRows(series: DataFrame[]): Rows {
  let rows = {
    largestValue: 0,
    rows: [],
  };
  if (series) {
    for (let dataFrameIndex = 0; dataFrameIndex < series.length; dataFrameIndex++) {
      const dataFrame = series[dataFrameIndex];
      if (!dataFrame.fields) {
        continue;
      }
      // Assumption first field is the location as GEO JSON
      const locationField = dataFrame.fields[0];
      for (let valueIndex = 0; valueIndex < locationField.values.length; valueIndex++) {
        const coords = decodeGeohash(locationField.values.get(valueIndex));
        let row = {
          location: coords,
          columns: [],
          totalValue: 0,
        } as Row;
        // @ts-ignore
        rows.rows.push(row);
        for (let fieldIndex = 1; fieldIndex < dataFrame.fields.length; fieldIndex++) {
          const field = dataFrame.fields[fieldIndex];
          const column = {
            field: field,
            value: field.values.get(valueIndex),
          };
          row.columns.push(column);
          row.totalValue += column.value;
          if (row.totalValue > rows.largestValue) {
            rows.largestValue = row.totalValue;
          }
        }
      }
    }
  }
  // console.log("Rows", rows);
  return rows;
}
