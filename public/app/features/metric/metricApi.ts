import {Metric} from '../../types';
import {getBackendSrv} from '@grafana/runtime';

export function saveMetric(metric: Metric) {
  const now = new Date();
  if (!metric.start) {
    metric.start = now;
  }
  if (!metric.finish) {
    metric.finish = now;
  }
  if (!metric.category) {
    metric.category = 'grafana';
  }
  if (!metric.values) {
    metric.values = {};
  }
  console.log('Save Metric type:' + metric.type + ', name:' + metric.name, metric);
  getBackendSrv()
    .post('/avenge/api/_/metric', JSON.stringify(metric))
    .then((r) => {
      // console.log('Saved metric', r);
    });
}
