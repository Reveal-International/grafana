import { DataFrame, Field, PanelProps } from '@grafana/data';
import { Map3dPanelOptions } from '../types';
import { decodeGeohash } from '../../geomap/utils/geohash';

const defaultColors: string[] = ['red', 'blue', 'green'];
const defaultDisplayNames: Map<string, string> = new Map([
  ['kpi-traffic-pedestrian', 'Pedestrian'],
  ['kpi-traffic-cycle', 'Cycle'],
  ['kpi-traffic-scooter', 'Scooter'],
]);

export class MetricValue {
  datetime: number | undefined;
  value: number;

  constructor(datetime: number | undefined, value: number) {
    this.datetime = datetime;
    this.value = value;
  }
}

export class Metric {
  name: string;
  displayName: string | undefined;
  color: string;
  values: MetricValue[] = [];

  constructor(name: string, values: MetricValue[]) {
    this.name = name;
    this.values = values;
  }

  addMetricValue(metricValue: MetricValue) {
    this.values.push(metricValue);
  }

  setDisplayName(displayName: string | undefined) {
    this.displayName = displayName;
  }

  getAvailableName(): string {
    if (this.displayName !== undefined) {
      return this.displayName;
    } else {
      return this.name;
    }
  }

  setColor(color: string) {
    this.color = color;
  }

  getColor(): string {
    return this.color;
  }

  getAggregatedMetricValues(): number {
    let aggregatedMetricValues = 0;

    this.values.forEach((metricValue: MetricValue) => {
      aggregatedMetricValues += metricValue.value;
    });

    return aggregatedMetricValues;
  }
}

export class GeoHashMetricGroup {
  geoHash: string;
  coordinates: [number, number];
  metrics: Metric[] = [];

  constructor(geoHash: string) {
    this.geoHash = geoHash;
    // @ts-ignore
    this.coordinates = decodeGeohash(geoHash);
  }

  addMetric(metric: Metric) {
    this.metrics.push(metric);
  }

  getAggregatedMetricValues(): number {
    let aggregatedMetricValues = 0;

    this.metrics.forEach((metric: Metric) => {
      aggregatedMetricValues += metric.getAggregatedMetricValues();
    });

    return aggregatedMetricValues;
  }

  getCopy(): GeoHashMetricGroup {
    const newGeoHashMetricGroup: GeoHashMetricGroup = new GeoHashMetricGroup(this.geoHash);
    newGeoHashMetricGroup.metrics = this.metrics;

    return newGeoHashMetricGroup;
  }
}

/**
 * Delegate method to parse data frame depending on the structure type that comes.
 */
export function getGeoHashMetricGroups(props: PanelProps<Map3dPanelOptions>): GeoHashMetricGroup[] {
  if (props.data.series !== undefined && props.data.series.length > 0) {
    let hasDateHistogram = false;
    // @ts-ignore
    const bucketAggs: any[] | undefined = props.data.request.targets[0].bucketAggs;
    bucketAggs?.forEach((field) => {
      if (field.type === 'date_histogram') {
        hasDateHistogram = true;
      }
    });

    if (hasDateHistogram) {
      return datetimeDataFramesParser(props);
    } else {
      return dataFramesParser(props);
    }
  } else {
    return [];
  }
}

/**
 * Parses a data frame structure to metrics by geo hash type which is then used by the map3d implementations.
 */
function dataFramesParser(props: PanelProps<Map3dPanelOptions>): GeoHashMetricGroup[] {
  const fields: Field[] = props.data.series[0].fields; // Assumption first item of series is the fields array
  // @ts-ignore
  const geoHashes: string[] = fields[0].values.buffer; // Assumption first item of fields is the event location geo hash a array

  // Define the amount of metrics to be processed
  const numberOfMetrics = fields.length - 1; // -1 because the first element is the event location field

  // We need to iterate over all of the geo hashes and inner loop through all of the metrics
  const geoHashMetricGroups: GeoHashMetricGroup[] = [];
  for (let i = 0; i < geoHashes.length; i++) {
    const geoHash = geoHashes[i];
    const geoHashMetricGroup: GeoHashMetricGroup = new GeoHashMetricGroup(geoHash);

    for (let metricIndex = 1; metricIndex <= numberOfMetrics; metricIndex++) {
      const metricField = fields[metricIndex];
      // @ts-ignore
      const name: string = metricField.name;
      const displayName: string | undefined = metricField.config.displayName; // This is an override from the configuration
      // @ts-ignore
      let color = defaultColors[metricIndex];
      if (metricField.config.color !== undefined) {
        // @ts-ignore
        color = metricField.config.color.fixedColor; // This is an override from the configuration
      }
      // @ts-ignore
      const value: number = metricField.values.buffer[i];

      const metricValue: MetricValue = new MetricValue(undefined, value);
      const metric: Metric = new Metric(name, [metricValue]);
      metric.setDisplayName(displayName);
      metric.setColor(color);

      geoHashMetricGroup.addMetric(metric);
    }

    geoHashMetricGroups.push(geoHashMetricGroup);
  }
  return geoHashMetricGroups;
}

/**
 * Parses a data frame structure to metrics by geo hash type which is then used by the map3d implementations.
 */
function datetimeDataFramesParser(props: PanelProps<Map3dPanelOptions>): GeoHashMetricGroup[] {
  const series: DataFrame[] = props.data.series;
  const geoHashMetricGroupByGeoHash: Map<string, GeoHashMetricGroup> = new Map();

  const metrics: string[] = [];
  // @ts-ignore
  props.data.request.targets[0].metrics.forEach((metric) => {
    metrics.push(metric.field);
  });

  // Transform to a metric name friendly format, this way we can use the index of the
  const dataFramesByGeoHash: Map<string, DataFrame[]> = new Map();
  for (let i = 0; i < series.length; i++) {
    const dataFrame: DataFrame = series[i];
    //@ts-ignore
    if (dataFramesByGeoHash.has(dataFrame.name)) {
      //@ts-ignore
      const dataFrames: DataFrame[] = dataFramesByGeoHash.get(dataFrame.name);
      dataFrames.push(dataFrame);
    } else {
      //@ts-ignore
      dataFramesByGeoHash.set(dataFrame.name, [dataFrame]);
    }
  }

  dataFramesByGeoHash.forEach((dataFrames) => {
    for (let i = 0; i < dataFrames.length; i++) {
      const dataFrame: DataFrame = dataFrames[i];
      //@ts-ignore
      const geoHash: string = dataFrame.name;

      //@ts-ignore
      const datetimes: [] = dataFrame.fields[0].values.buffer;
      //@ts-ignore
      const values: [] = dataFrame.fields[1].values.buffer;

      for (let datetimeIndex = 0; datetimeIndex < datetimes.length; datetimeIndex++) {
        const datetime: number = datetimes[datetimeIndex];
        const value: number = values[datetimeIndex];

        if (!geoHashMetricGroupByGeoHash.has(geoHash)) {
          const geoHashMetricGroup: GeoHashMetricGroup = new GeoHashMetricGroup(geoHash);
          const metricValue: MetricValue = new MetricValue(datetime, value);
          // @ts-ignore
          const metric: Metric = new Metric(metrics[i], [metricValue]);
          if (defaultDisplayNames.has(metrics[i])) {
            metric.setDisplayName(defaultDisplayNames.get(metrics[i]));
          }
          metric.setColor(defaultColors[i]);
          geoHashMetricGroup.addMetric(metric);
          geoHashMetricGroupByGeoHash.set(geoHash, geoHashMetricGroup);
        } else {
          //@ts-ignore
          const existingGeoHashMetricGroup: GeoHashMetricGroup = geoHashMetricGroupByGeoHash.get(geoHash);
          let metricFound = false;
          existingGeoHashMetricGroup.metrics.forEach((existingMetric: Metric) => {
            if (existingMetric.name === metrics[i]) {
              const metricValue: MetricValue = new MetricValue(datetime, value);
              existingMetric.addMetricValue(metricValue);
              metricFound = true;
            }
          });

          if (!metricFound) {
            const metricValue: MetricValue = new MetricValue(datetime, value);
            const metric: Metric = new Metric(metrics[i], [metricValue]);
            if (defaultDisplayNames.has(metrics[i])) {
              metric.setDisplayName(defaultDisplayNames.get(metrics[i]));
            }
            metric.setColor(defaultColors[i]);
            existingGeoHashMetricGroup.addMetric(metric);
          }
        }
      }
    }
  });

  return Array.from(geoHashMetricGroupByGeoHash.values());
}
