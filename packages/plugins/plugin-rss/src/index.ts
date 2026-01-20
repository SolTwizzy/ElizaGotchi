import { feedProvider as _feedProvider } from './providers/feed-provider';
import { feedActionsProvider as _feedActionsProvider } from './actions/feed-actions';

export {
  feedProvider,
  fetchFeed,
  fetchMultipleFeeds,
  getRecentItems,
  searchFeeds,
  createDigest,
} from './providers/feed-provider';

export type { Feed, FeedItem, FeedDigest } from './providers/feed-provider';

export {
  feedActionsProvider,
  subscribeFeed,
  unsubscribeFeed,
  getSubscription,
  getAllSubscriptions,
  updateSubscription,
  checkFeedForUpdates,
  startMonitoring,
  stopMonitoring,
  generateFeedSummary,
  searchAllFeeds,
  subscribeToCollection,
  FEED_COLLECTIONS,
} from './actions/feed-actions';

export type {
  FeedSubscription,
  FeedAlert,
  FeedActionResult,
} from './actions/feed-actions';

// Plugin definition
export const rssPlugin = {
  name: '@elizagotchi/plugin-rss',
  version: '0.1.0',
  description: 'RSS feed integration plugin for monitoring news and content',

  providers: [_feedProvider],

  actions: [_feedActionsProvider],
};

export default rssPlugin;
