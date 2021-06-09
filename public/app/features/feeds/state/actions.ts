import { ThunkResult } from 'app/types';
import { feedLoaded, feedsLoaded } from './reducers';
import { updateNavIndex } from 'app/core/actions';
import { buildNavModel } from './navModel';

export function loadFeeds(): ThunkResult<void> {
  return async (dispatch) => {
    // TODO goto backend - question is do we go our own or delve into GO - My 2c our own
    // const response = await getBackendSrv().get('/api/feeds/search', { perpage: 1000, page: 1 });
    // dispatch(feedsLoaded(response.feeds));
    dispatch(
      feedsLoaded([
        { id: 1, name: 'Feed1', enabled: true },
        { id: 2, name: 'Feed2', enabled: true },
      ])
    );
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
