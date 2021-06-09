import { Feed, FeedsState, FeedState } from 'app/types/feeds';

export const getSearchQuery = (state: FeedsState) => state.searchQuery;
export const getFeedsCount = (state: FeedsState) => state.feeds.length;

export const getFeed = (state: FeedState, currentFeedId: any): Feed | null => {
  if (state.feed.id === parseInt(currentFeedId, 10)) {
    return state.feed;
  }

  return null;
};

export const getFeeds = (state: FeedsState) => {
  const regex = RegExp(state.searchQuery, 'i');

  return state.feeds.filter((feed) => {
    return regex.test(feed.name);
  });
};
