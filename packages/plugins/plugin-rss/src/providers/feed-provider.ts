import Parser from 'rss-parser';

export interface FeedItem {
  title: string;
  link: string;
  content: string;
  contentSnippet: string;
  pubDate: string;
  author?: string;
  categories?: string[];
  source: string;
}

export interface Feed {
  title: string;
  description?: string;
  link: string;
  lastBuildDate?: string;
  items: FeedItem[];
}

export interface FeedDigest {
  period: {
    start: Date;
    end: Date;
  };
  totalItems: number;
  items: FeedItem[];
  topCategories: Array<{ category: string; count: number }>;
}

const parser = new Parser();

export async function fetchFeed(url: string): Promise<Feed> {
  const feed = await parser.parseURL(url);

  return {
    title: feed.title || 'Unknown Feed',
    description: feed.description,
    link: feed.link || url,
    lastBuildDate: feed.lastBuildDate,
    items: feed.items.map((item) => ({
      title: item.title || 'No title',
      link: item.link || '',
      content: item.content || '',
      contentSnippet: item.contentSnippet || '',
      pubDate: item.pubDate || '',
      author: item.creator || item.author,
      categories: item.categories,
      source: feed.title || url,
    })),
  };
}

export async function fetchMultipleFeeds(urls: string[]): Promise<Feed[]> {
  const feedPromises = urls.map((url) =>
    fetchFeed(url).catch((error) => {
      console.error(`Error fetching feed ${url}:`, error);
      return null;
    })
  );

  const feeds = await Promise.all(feedPromises);
  return feeds.filter((feed): feed is Feed => feed !== null);
}

export async function getRecentItems(
  urls: string[],
  limit: number = 20,
  sinceHours: number = 24
): Promise<FeedItem[]> {
  const feeds = await fetchMultipleFeeds(urls);
  const cutoff = new Date(Date.now() - sinceHours * 60 * 60 * 1000);

  const allItems = feeds
    .flatMap((feed) => feed.items)
    .filter((item) => new Date(item.pubDate) > cutoff)
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, limit);

  return allItems;
}

export async function searchFeeds(
  urls: string[],
  keywords: string[],
  limit: number = 20
): Promise<FeedItem[]> {
  const feeds = await fetchMultipleFeeds(urls);
  const keywordsLower = keywords.map((k) => k.toLowerCase());

  const matchingItems = feeds
    .flatMap((feed) => feed.items)
    .filter((item) => {
      const text = `${item.title} ${item.contentSnippet}`.toLowerCase();
      return keywordsLower.some((keyword) => text.includes(keyword));
    })
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, limit);

  return matchingItems;
}

export async function createDigest(
  urls: string[],
  periodHours: number = 24
): Promise<FeedDigest> {
  const end = new Date();
  const start = new Date(Date.now() - periodHours * 60 * 60 * 1000);

  const items = await getRecentItems(urls, 100, periodHours);

  // Count categories
  const categoryCount: Record<string, number> = {};
  items.forEach((item) => {
    item.categories?.forEach((cat) => {
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
  });

  const topCategories = Object.entries(categoryCount)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    period: { start, end },
    totalItems: items.length,
    items,
    topCategories,
  };
}

export const feedProvider = {
  name: 'feed-provider',
  description: 'Provides RSS feed data',
  fetchFeed,
  fetchMultipleFeeds,
  getRecentItems,
  searchFeeds,
  createDigest,
};
