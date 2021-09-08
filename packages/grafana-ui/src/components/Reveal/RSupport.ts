/* eslint-disable id-blacklist, no-restricted-imports, @typescript-eslint/ban-types */
import moment, { DurationInputArg2 } from 'moment';
import {
  DataFrame,
  dateTimeFormat,
  DisplayProcessor,
  Field,
  formattedValueToString,
  getFieldDisplayName,
  TimeRange,
} from '@grafana/data';
import React from 'react';

export interface DeltaCalculation {
  baseValue: number;
  baseValueString: string;
  fieldValue: number;
  fieldValueString: string;
  percent: number;
  percentString: string;
  delta: number;
  deltaString: string;
  trendImg: React.ReactNode;
}

/**
 * Hack to try and find our corresponding field when we have an outer join applied.
 * Copied from packages/grafana-data/src/field/fieldState.ts
 */
function getUniqueFieldName(field: Field, frame?: DataFrame) {
  let dupeCount = 0;
  let foundSelf = false;

  if (frame) {
    for (let i = 0; i < frame.fields.length; i++) {
      const otherField = frame.fields[i];

      if (field === otherField) {
        foundSelf = true;

        if (dupeCount > 0) {
          dupeCount++;
          break;
        }
      } else if (field.name === otherField.name) {
        dupeCount++;

        if (foundSelf) {
          break;
        }
      }
    }
  }

  if (dupeCount) {
    return `${field.name} ${dupeCount}`;
  }

  return field.name;
}

/**
 * Generic Reveal support class with some useful functions.
 **/
export const RSupport = {
  fieldNameMatches(frame: DataFrame, field: Field, name: string): boolean {
    if (field.name === name) {
      return true;
    } else if (getFieldDisplayName(field, frame) === name) {
      return true;
    } else if (getUniqueFieldName(field, frame) === name) {
      return true;
    }
    return false;
  },

  calculateFieldDelta(
    displayProcessor: DisplayProcessor,
    frames: DataFrame[],
    field: Field,
    dataPointIndex: number
  ): DeltaCalculation {
    const fieldValue = field.values.get(dataPointIndex);
    let calc = {} as DeltaCalculation;
    calc.fieldValue = fieldValue;
    calc.fieldValueString = formattedValueToString(displayProcessor(calc.fieldValue));
    // Does it have the time offset this field is relative to?
    if (!field.config.compareTo) {
      return calc;
    }
    // Find field that that we are comparing to.
    let baseField;
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      baseField = frame.fields.find((f) => this.fieldNameMatches(frame, f, field.config.compareTo!));
      if (baseField) {
        break;
      }
    }
    if (!baseField) {
      console.warn('Could not find series with name ' + field.config.compareTo, frames);
      return calc;
    }
    // Now do calculation relative to our target field.
    return this.calculateDeltaValue(displayProcessor, baseField.values.get(dataPointIndex), fieldValue);
  },

  calculateDeltaValue(
    displayProcessor: DisplayProcessor,
    baseFieldValue: number,
    fieldValue: number
  ): DeltaCalculation {
    let calc = {} as DeltaCalculation;
    calc.baseValue = baseFieldValue === undefined ? 0 : baseFieldValue;
    calc.baseValueString = formattedValueToString(displayProcessor(calc.baseValue));
    calc.fieldValue = fieldValue === undefined ? 0 : fieldValue;
    calc.fieldValueString = formattedValueToString(displayProcessor(calc.fieldValue));
    calc.delta = calc.fieldValue - calc.baseValue;
    if (calc.fieldValue === calc.baseValue) {
      calc.percentString = '0%';
      calc.trendImg = React.createElement('img', { src: 'public/img/icon_trending_flat.png' });
    } else if (calc.fieldValue > calc.baseValue) {
      calc.trendImg = React.createElement('img', { src: 'public/img/icon_trending_up.png' });
      if (calc.baseValue) {
        calc.percent = Math.round((100.0 * (calc.fieldValue - calc.baseValue)) / calc.baseValue);
        calc.percentString = '+' + calc.percent + '%';
      } else {
        calc.percentString = '+100%';
      }
    } else {
      calc.trendImg = React.createElement('img', { src: 'public/img/icon_trending_down.png' });
      if (calc.baseValue) {
        calc.percent = Math.round((100.0 * (calc.fieldValue - calc.baseValue)) / calc.baseValue);
        calc.percentString = calc.percent + '%';
      } else {
        calc.percentString = '-100%';
      }
    }
    const deltaDisplay = displayProcessor(calc.delta);
    calc.deltaString = formattedValueToString(deltaDisplay);
    if (calc.delta && calc.delta > 0) {
      calc.deltaString = '+' + calc.deltaString;
    }
    return calc;
  },

  /**
   * Returns a string representing the date; applying the offset if specified.
   * @param date
   * @param timeZone
   * @param timeOffset
   * @param timeFormat
   */
  formatDate(date: any, timeZone: string, timeOffset?: string, timeFormat?: string) {
    if (timeOffset) {
      const parts = timeOffset.trim().match(/^(\d+)([s|m|h|d|w|M|y])$/);
      if (parts?.length === 3) {
        const duration = moment.duration(parseInt(parts[1], 10), parts[2] as DurationInputArg2);
        date = moment(date).subtract(duration).valueOf();
      }
    }
    return dateTimeFormat(date, {
      format: timeFormat,
      timeZone: timeZone,
    });
  },

  /**
   * Returns a string representing the date range; applying the offset if specified.
   * @param timeRange
   * @param timeZone
   * @param timeOffset e.g 1d 3w 2y 4M
   * @param timeFormat?
   **/
  formatDateRange(timeRange: TimeRange, timeZone: string, timeOffset?: string, timeFormat?: string): string {
    let start = timeRange.from.valueOf();
    let finish = timeRange.to.valueOf();
    if (timeOffset) {
      const parts = timeOffset.trim().match(/^(\d+)([s|m|h|d|w|M|y])$/);
      if (parts?.length === 3) {
        const duration = moment.duration(parseInt(parts[1], 10), parts[2] as DurationInputArg2);
        start = moment(start).subtract(duration).valueOf();
        finish = moment(finish).subtract(duration).valueOf();
      }
    }
    const startStr = dateTimeFormat(start, {
      format: timeFormat,
      timeZone: timeZone,
    });
    const finishStr = dateTimeFormat(finish, {
      format: timeFormat,
      timeZone: timeZone,
    });
    // TODO maybe more styly and maybe use template
    const range = startStr + ' to ' + finishStr;
    return range;
  },
};
