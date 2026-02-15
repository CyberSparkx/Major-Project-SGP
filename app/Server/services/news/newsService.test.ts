import axios from 'axios';
import { NewsService } from './newsService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockResolvedValue({
      content: JSON.stringify({
        selected_indices: [1, 2],
        summary: 'Mocked summary',
      }),
    }),
  })),
}));

// Mock process.env
process.env.GOOGLE_API_KEY = 'test-api-key';

describe('NewsService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and parse news items correctly', async () => {
    const mockRss = `
      <rss version="2.0">
        <channel>
          <item>
            <title>Test News Title</title>
            <link>https://example.com/news/1</link>
            <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
            <source>Test Source</source>
          </item>
          <item>
            <title>Another News</title>
            <link>https://example.com/news/2</link>
            <pubDate>Mon, 01 Jan 2024 11:00:00 GMT</pubDate>
            <source>Another Source</source>
          </item>
        </channel>
      </rss>
    `;

    mockedAxios.get.mockResolvedValue({ data: mockRss });

    const { articles, summary } = await NewsService.fetchNews('technology');

    expect(articles).toHaveLength(2);
    expect(articles[0]).toEqual({
      title: 'Test News Title',
      link: 'https://example.com/news/1',
      pubDate: 'Mon, 01 Jan 2024 10:00:00 GMT',
      source: 'Test Source',
    });
    expect(articles[1].title).toBe('Another News');
    expect(summary).toBeDefined();
  });

  it('should throw an error if topic is missing', async () => {
    await expect(NewsService.fetchNews('')).rejects.toThrow(
      'Topic is required'
    );
  });

  it('should throw an error if axios fails', async () => {
    // Suppress console.error for this test case since we expect it to be called
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mockedAxios.get.mockRejectedValue(new Error('Network Error'));
    await expect(NewsService.fetchNews('tech')).rejects.toThrow(
      'Failed to fetch news'
    );

    // Optional: Verify that error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching news:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
