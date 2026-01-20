import { fetchFeed, fetchMultipleFeeds, getRecentItems, searchFeeds, createDigest, type Feed, type FeedItem, type FeedDigest } from '../providers/feed-provider';

export interface FeedSubscription {
  id: string;
  url: string;
  name: string;
  enabled: boolean;
  keywords?: string[];
  lastChecked?: Date;
  checkIntervalMinutes: number;
  createdAt: Date;
}

export interface FeedAlert {
  subscription: FeedSubscription;
  items: FeedItem[];
  timestamp: Date;
}

export interface FeedActionResult {
  success: boolean;
  message: string;
  data?: unknown;
}

// In-memory subscription store (would be persisted in production)
const subscriptions: Map<string, FeedSubscription> = new Map();
const alertCallbacks: Map<string, (alert: FeedAlert) => void> = new Map();
const checkIntervals: Map<string, NodeJS.Timeout> = new Map();

function generateId(): string {
  return `feed_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function subscribeFeed(
  url: string,
  name?: string,
  options?: {
    keywords?: string[];
    checkIntervalMinutes?: number;
  }
): Promise<FeedActionResult> {
  try {
    // Validate feed URL by fetching it
    const feed = await fetchFeed(url);

    const subscription: FeedSubscription = {
      id: generateId(),
      url,
      name: name ?? feed.title,
      enabled: true,
      keywords: options?.keywords,
      checkIntervalMinutes: options?.checkIntervalMinutes ?? 30,
      createdAt: new Date(),
    };

    subscriptions.set(subscription.id, subscription);

    return {
      success: true,
      message: `Subscribed to feed: ${subscription.name}`,
      data: subscription,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to subscribe to feed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export function unsubscribeFeed(subscriptionId: string): FeedActionResult {
  const subscription = subscriptions.get(subscriptionId);

  if (!subscription) {
    return {
      success: false,
      message: `Subscription not found: ${subscriptionId}`,
    };
  }

  // Stop monitoring if active
  const interval = checkIntervals.get(subscriptionId);
  if (interval) {
    clearInterval(interval);
    checkIntervals.delete(subscriptionId);
  }

  subscriptions.delete(subscriptionId);
  alertCallbacks.delete(subscriptionId);

  return {
    success: true,
    message: `Unsubscribed from feed: ${subscription.name}`,
  };
}

export function getSubscription(subscriptionId: string): FeedSubscription | undefined {
  return subscriptions.get(subscriptionId);
}

export function getAllSubscriptions(): FeedSubscription[] {
  return Array.from(subscriptions.values());
}

export function updateSubscription(
  subscriptionId: string,
  updates: Partial<Pick<FeedSubscription, 'name' | 'enabled' | 'keywords' | 'checkIntervalMinutes'>>
): FeedActionResult {
  const subscription = subscriptions.get(subscriptionId);

  if (!subscription) {
    return {
      success: false,
      message: `Subscription not found: ${subscriptionId}`,
    };
  }

  const updated = { ...subscription, ...updates };
  subscriptions.set(subscriptionId, updated);

  return {
    success: true,
    message: `Updated subscription: ${updated.name}`,
    data: updated,
  };
}

export async function checkFeedForUpdates(
  subscriptionId: string
): Promise<FeedItem[]> {
  const subscription = subscriptions.get(subscriptionId);

  if (!subscription || !subscription.enabled) {
    return [];
  }

  const items = await getRecentItems([subscription.url], 20, 1); // Last hour

  // Filter by keywords if specified
  if (subscription.keywords && subscription.keywords.length > 0) {
    const keywordsLower = subscription.keywords.map((k) => k.toLowerCase());
    return items.filter((item) => {
      const text = `${item.title} ${item.contentSnippet}`.toLowerCase();
      return keywordsLower.some((keyword) => text.includes(keyword));
    });
  }

  subscription.lastChecked = new Date();
  subscriptions.set(subscriptionId, subscription);

  return items;
}

export function startMonitoring(
  subscriptionId: string,
  onAlert: (alert: FeedAlert) => void
): FeedActionResult {
  const subscription = subscriptions.get(subscriptionId);

  if (!subscription) {
    return {
      success: false,
      message: `Subscription not found: ${subscriptionId}`,
    };
  }

  // Stop existing monitoring
  const existingInterval = checkIntervals.get(subscriptionId);
  if (existingInterval) {
    clearInterval(existingInterval);
  }

  alertCallbacks.set(subscriptionId, onAlert);

  const intervalMs = subscription.checkIntervalMinutes * 60 * 1000;

  const checkAndAlert = async () => {
    try {
      const items = await checkFeedForUpdates(subscriptionId);
      if (items.length > 0) {
        const callback = alertCallbacks.get(subscriptionId);
        if (callback) {
          callback({
            subscription,
            items,
            timestamp: new Date(),
          });
        }
      }
    } catch (error) {
      console.error(`Error checking feed ${subscription.name}:`, error);
    }
  };

  // Initial check
  checkAndAlert();

  // Set up interval
  const interval = setInterval(checkAndAlert, intervalMs);
  checkIntervals.set(subscriptionId, interval);

  return {
    success: true,
    message: `Started monitoring feed: ${subscription.name}`,
  };
}

export function stopMonitoring(subscriptionId: string): FeedActionResult {
  const subscription = subscriptions.get(subscriptionId);

  if (!subscription) {
    return {
      success: false,
      message: `Subscription not found: ${subscriptionId}`,
    };
  }

  const interval = checkIntervals.get(subscriptionId);
  if (interval) {
    clearInterval(interval);
    checkIntervals.delete(subscriptionId);
  }

  alertCallbacks.delete(subscriptionId);

  return {
    success: true,
    message: `Stopped monitoring feed: ${subscription.name}`,
  };
}

export async function generateFeedSummary(
  subscriptionIds?: string[],
  periodHours: number = 24
): Promise<FeedDigest> {
  const subs = subscriptionIds
    ? subscriptionIds.map((id) => subscriptions.get(id)).filter(Boolean) as FeedSubscription[]
    : getAllSubscriptions();

  const urls = subs.filter((s) => s.enabled).map((s) => s.url);

  return createDigest(urls, periodHours);
}

export async function searchAllFeeds(
  keywords: string[],
  limit: number = 20
): Promise<FeedItem[]> {
  const urls = getAllSubscriptions()
    .filter((s) => s.enabled)
    .map((s) => s.url);

  return searchFeeds(urls, keywords, limit);
}

// Pre-configured feed collections for common use cases
export const FEED_COLLECTIONS = {
  crypto: [
    'https://cointelegraph.com/rss',
    'https://www.coindesk.com/arc/outboundfeeds/rss/',
    'https://decrypt.co/feed',
    'https://thedefiant.io/feed',
  ],
  tech: [
    'https://techcrunch.com/feed/',
    'https://www.theverge.com/rss/index.xml',
    'https://arstechnica.com/feed/',
    'https://feeds.wired.com/wired/index',
  ],
  defi: [
    'https://thedefiant.io/feed',
    'https://rekt.news/feed.xml',
  ],
  developer: [
    'https://dev.to/feed',
    'https://hnrss.org/frontpage',
    'https://github.blog/feed/',
  ],
};

export async function subscribeToCollection(
  collection: keyof typeof FEED_COLLECTIONS,
  options?: {
    keywords?: string[];
    checkIntervalMinutes?: number;
  }
): Promise<FeedActionResult[]> {
  const urls = FEED_COLLECTIONS[collection];
  const results: FeedActionResult[] = [];

  for (const url of urls) {
    const result = await subscribeFeed(url, undefined, options);
    results.push(result);
  }

  return results;
}

export const feedActionsProvider = {
  name: 'feed-actions',
  description: 'Actions for managing RSS feed subscriptions',
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
};
