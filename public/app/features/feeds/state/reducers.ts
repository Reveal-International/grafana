import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Feed, FeedsState, FeedState } from 'app/types/feeds';

export const initialFeedsState: FeedsState = { feeds: [], searchQuery: '', hasFetched: false };

const feedsSlice = createSlice({
  name: 'feeds',
  initialState: initialFeedsState,
  reducers: {
    feedsLoaded: (state, action: PayloadAction<Feed[]>): FeedsState => {
      return { ...state, hasFetched: true, feeds: action.payload };
    },
    setSearchQuery: (state, action: PayloadAction<string>): FeedsState => {
      return { ...state, searchQuery: action.payload };
    },
  },
});

export const { feedsLoaded, setSearchQuery } = feedsSlice.actions;

export const feedsReducer = feedsSlice.reducer;

export const initialFeedState: FeedState = {
  feed: {} as Feed,
};

const feedSlice = createSlice({
  name: 'feed',
  initialState: initialFeedState,
  reducers: {
    feedLoaded: (state, action: PayloadAction<Feed>): FeedState => {
      return { ...state, feed: action.payload };
    },
  },
});

export const { feedLoaded } = feedSlice.actions;

export const feedReducer = feedSlice.reducer;

export default {
  feeds: feedsReducer,
  feed: feedReducer,
};
