import { Metric } from '../../types';
import { getBackendSrv } from '@grafana/runtime';
import { contextSrv } from 'app/core/services/context_srv';

export function saveMetric(metric: Metric) {
  console.log('Save Metric', metric);
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
  if (!metric.userId) {
    metric.userId = '' + contextSrv.user.id;
  }
  if (!metric.userName) {
    metric.userName = '' + contextSrv.user.login;
  }
  if (!metric.userEmail) {
    metric.userEmail = '' + contextSrv.user.email;
  }
  if (!metric.userOrgId) {
    metric.userOrgId = '' + contextSrv.user.orgId;
  }
  if (!metric.values) {
    metric.values = {};
  }
  // Add in some global stuff now
  metric.values.orgRole = contextSrv.user.orgRole;
  metric.values.isGrafanaAdmin = contextSrv.user.isGrafanaAdmin;
  getBackendSrv()
    .post('/avenge/api/_/metric', JSON.stringify(metric))
    .then((r) => console.log('Saved metric', r));
}
