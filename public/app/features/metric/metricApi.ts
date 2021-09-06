import { Metric } from '../../types';
import { getBackendSrv } from '@grafana/runtime';

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
  // eslint-disable-next-line no-console
  console.debug('Save Metric type:' + metric.type + ', name:' + metric.name, metric);
  getBackendSrv()
    .request({ method: 'POST', url: '/avenge/api/_/metric', data: JSON.stringify(metric), showErrorAlert: false })
    .then((r) => {
      // console.log('Saved metric', r);
    });
}
