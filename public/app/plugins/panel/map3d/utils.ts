import {
  DataFrame,
  Field,
  formattedValueToString,
  getDisplayProcessor,
  getFieldDisplayName,
  GrafanaTheme2,
} from '@grafana/data';
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

export function dataFramesToRows(theme: GrafanaTheme2, series: DataFrame[], numCategories?: number): Rows {
  let rows: Rows = {
    largestColumnValue: 0,
    largestRowTotal: 0,
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
        let row: Row = {
          index: rows.rows.length,
          location: coords,
          columns: [],
          totalValue: 0,
          largestValue: 0,
          category: 0,
        } as Row;
        rows.rows.push(row);
        for (let fieldIndex = 1; fieldIndex < dataFrame.fields.length; fieldIndex++) {
          const field = dataFrame.fields[fieldIndex];
          const fieldFmt = field.display || getDisplayProcessor({ field, theme });
          const fieldValue = field.values.get(valueIndex);
          const column = {
            index: row.columns.length,
            field: field,
            fieldName: getFieldDisplayName(field, dataFrame),
            frame: dataFrame,
            value: fieldValue,
            category: 0,
            displayValue: formattedValueToString(fieldFmt(fieldValue)),
          };
          row.columns.push(column);
          row.totalValue += column.value;
          if (column.value > row.largestValue) {
            row.largestValue = column.value;
          }
          if (column.value > rows.largestColumnValue) {
            rows.largestColumnValue = column.value;
          }
          if (row.totalValue > rows.largestRowTotal) {
            rows.largestRowTotal = row.totalValue;
          }
        }
      }
    }
  }
  const cats = numCategories ? numCategories : 5;
  rows.rows.forEach((row) => {
    if (row.totalValue > 0) {
      row.category = Math.floor((cats * row.totalValue) / rows.largestRowTotal);
    }
    row.columns.forEach((column) => {
      if (column.value > 0) {
        column.category = Math.floor((cats * column.value) / row.largestValue);
      }
    });
  });
  console.log('Rows', rows);
  return rows;
}
