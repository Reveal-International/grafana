export interface Feed {
  id: number;
  name: string;
  enabled: boolean;
  // TODO
}

export interface FeedsState {
  feeds: Feed[];
  searchQuery: string;
  hasFetched: boolean;
}

export interface FeedState {
  feed: Feed;
}
