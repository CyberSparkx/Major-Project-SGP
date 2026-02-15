import { GET } from './route';
import { NextRequest } from 'next/server';
import { NewsService } from '../../Server/services/news/newsService';

// Mock NewsService
jest.mock('../../Server/services/newsService');

describe('GET /api/news', () => {
  it('should return news for a valid topic', async () => {
    const mockNews = [
      { title: 'News 1', link: 'url1', pubDate: 'date1', source: 'source1' },
    ];
    // Updated mock return value
    (NewsService.fetchNews as jest.Mock).mockResolvedValue({
      summary: 'Mock Summary',
      articles: mockNews,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/news?topic=tech'
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      topic: 'tech',
      summary: 'Mock Summary',
      news: mockNews,
    });
  });

  it('should return 400 if topic is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/news');
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Topic query parameter is required');
  });

  it('should return 500 if service fails', async () => {
    (NewsService.fetchNews as jest.Mock).mockRejectedValue(
      new Error('Service Error')
    );

    const req = new NextRequest('http://localhost:3000/api/news?topic=tech');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch news');
  });
});
