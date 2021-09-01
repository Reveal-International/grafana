/* eslint-disable id-blacklist, no-restricted-imports, @typescript-eslint/ban-types */
import moment, { DurationInputArg2 } from 'moment';
import { dateTimeFormat, TimeRange } from '@grafana/data';

/**
 * Generic Reveal support class with some useful functions.
 **/
export const RSupport = {
  /**
   * Returns a string representing the date; applying the offset if specified.
   * @param date
   * @param timeZone
   * @param timeOffset
   * @param timeFormat
   */
  formatDate(date: any, timeZone: string, timeOffset?: string, timeFormat?: string) {
    if (timeOffset) {
      const parts = timeOffset.match(/^(\d+)([s|m|h|d|w|M|y])$/);
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
      const parts = timeOffset.match(/^(\d+)([s|m|h|d|w|M|y])$/);
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
