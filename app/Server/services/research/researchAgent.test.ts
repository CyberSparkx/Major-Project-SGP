import { processResearchRequest } from './researchAgent';
import { searchWeb } from '../../tools/searchTool';
import { scrapeContent } from '../../tools/scraperTool';
import { GoogleGenerativeAI } from '@google/generative-ai';

jest.mock('../../tools/searchTool');
jest.mock('../../tools/scraperTool');
jest.mock('@google/generative-ai');

const mockedSearchWeb = searchWeb as jest.MockedFunction<typeof searchWeb>;
const mockedScrapeContent = scrapeContent as jest.MockedFunction<
  typeof scrapeContent
>;

describe('ResearchAgent', () => {
  let mockGenerateContent: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_API_KEY = 'test-key';

    mockGenerateContent = jest.fn().mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            title: 'Test Title',
            summary: 'Test Summary',
            keyPoints: ['Point 1', 'Point 2'],
            content: 'Detailed report content',
          }),
      },
    });

    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: () => ({
        generateContent: mockGenerateContent,
      }),
    }));
  });

  it('should process a text-only research request successfully', async () => {
    mockedSearchWeb.mockResolvedValue([
      {
        title: 'Source 1',
        link: 'https://s1.com',
        snippet: 'Snippet 1',
        source: 'S1',
      },
    ]);
    mockedScrapeContent.mockResolvedValue('Scraped content text');

    const result = await processResearchRequest({ query: 'Quantum Computing' });

    expect(mockedSearchWeb).toHaveBeenCalledWith('Quantum Computing');
    expect(mockedScrapeContent).toHaveBeenCalledWith('https://s1.com');
    expect(result.title).toBe('Test Title');
    expect(result.sources).toHaveLength(1);
  });

  it('should handle zero search results gracefully', async () => {
    mockedSearchWeb.mockResolvedValue([]);
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            title: 'No Sources Found',
            summary: 'I could not find any specific sources.',
            keyPoints: [],
            content: 'General knowledge report',
          }),
      },
    });

    const result = await processResearchRequest({
      query: 'NonExistentTopic123',
    });

    expect(result.title).toBe('No Sources Found');
    expect(result.sources).toHaveLength(0);
  });

  it('should handle image-based research decisions', async () => {
    mockedSearchWeb.mockResolvedValue([]);

    // Mock the vision model decision
    mockGenerateContent
      .mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify({ type: 'research', topic: 'Identified Landmark' }),
        },
      })
      .mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify({
              title: 'Landmark Research',
              summary: 'Summary',
              content: 'Content',
            }),
        },
      });

    const result = await processResearchRequest({
      query: 'Research this',
      image:
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    });

    expect(result.title).toBe('Landmark Research');
  });

  it('should throw error if query is missing and image analysis fails', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Vision failure'));

    await expect(
      processResearchRequest({ query: '', image: 'base64' })
    ).rejects.toThrow('Could not understand image and no text query provided.');
  });
});
