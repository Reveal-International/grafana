import { ThunkResult } from 'app/types';
import { feedLoaded, feedsLoaded } from './reducers';
import { updateNavIndex } from 'app/core/actions';
import { buildNavModel } from './navModel';
import { getBackendSrv } from '@grafana/runtime';
import { saveMetric } from '../../metric/metricApi';

export function loadFeeds(): ThunkResult<void> {
  return async (dispatch) => {
    // TODO is client an organisation?
    const clientCode = '_';
    const response = await getBackendSrv().get('/avenge/client/' + clientCode + '/feeds', {});
    saveMetric({ name: 'loadFeeds', type: 'feeds', values: { v: 'v1' }, clientCode: clientCode });
    dispatch(feedsLoaded(response));
  };
}

export function loadFeed(id: number): ThunkResult<void> {
  return async (dispatch) => {
    // TODO goto backend - question is do we go our own or delve into GO - My 2c our own
    // const response = await getBackendSrv().get(`/api/feeds/${id}`);
    const response = { id: id, name: 'Feed' + id, enabled: true };
    dispatch(feedLoaded(response));
    dispatch(updateNavIndex(buildNavModel(response)));
  };
}

export function deleteFeed(id: number): ThunkResult<void> {
  return async (dispatch) => {
    // TODO goto backend - question is do we go our own or delve into GO - My 2c our own
    console.error('TODO Delete feed is not implemented');
    // await getBackendSrv().delete(`/api/feeds/${id}`);
    dispatch(loadFeeds());
  };
}
