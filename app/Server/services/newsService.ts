import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export class NewsService {
  private static BASE_URL = 'https://news.google.com/rss/search';

  static async fetchNews(
    topic: string
  ): Promise<{ summary: string; articles: NewsItem[] }> {
    if (!topic) {
      throw new Error('Topic is required');
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is not defined in environment variables');
    }

    try {
      const response = await axios.get(this.BASE_URL, {
        params: { q: topic, hl: 'en-US', gl: 'US', ceid: 'US:en' },
      });

      const $ = cheerio.load(response.data, { xmlMode: true });
      const allNewsItems: NewsItem[] = [];

      $('item').each((_, element) => {
        const title = $(element).find('title').text();
        const link = $(element).find('link').text();
        const pubDate = $(element).find('pubDate').text();
        const source = $(element).find('source').text();

        allNewsItems.push({
          title,
          link,
          pubDate,
          source,
        });
      });

      // Take top 10 for context to choose from
      const candidateItems = allNewsItems.slice(0, 10);

      if (candidateItems.length === 0) {
        return { summary: 'No news found.', articles: [] };
      }

      // Initialize Gemini using Google Generative AI SDK
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Prepare prompt
      const articlesText = candidateItems
        .map(
          (item, index) =>
            `${index + 1}. Title: ${item.title}\n   Source: ${item.source}\n   Date: ${item.pubDate}`
        )
        .join('\n\n');

      const prompt = `
You are a helpful news assistant.
I have a list of news articles about "${topic}".
Please do two things:
1. Select the 4 most relevant and valuable articles from the list.
2. Write a single concise paragraph summarizing the key events or themes based on these articles.

Input Articles:
${articlesText}

Output Format (JSON strictly):
{
  "selected_indices": [1, 3, ...],
  "summary": "Your summary here..."
}
`;

      let content = '';
      try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        content = response.text();
      } catch (error) {
        console.error('Gemini API Error:', error);
        // Fallback on error
        return {
          summary: 'Latest news on ' + topic,
          articles: candidateItems.slice(0, 4),
        };
      }

      if (!content) {
        console.error('Gemini returned empty content');
        return {
          summary: 'Latest news on ' + topic,
          articles: candidateItems.slice(0, 4),
        };
      }

      // Clean up code blocks if present
      const jsonString = content
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      let parsedResult: { selected_indices: number[]; summary: string };
      try {
        parsedResult = JSON.parse(jsonString);
      } catch (e) {
        console.error('Failed to parse Gemini response:', content);
        // Fallback: take top 4 and generic summary
        return {
          summary: 'Latest news on ' + topic,
          articles: candidateItems.slice(0, 4),
        };
      }

      const selectedArticles = parsedResult.selected_indices
        .map((index) => candidateItems[index - 1]) // Adjust for 1-based index
        .filter((item) => item !== undefined)
        .slice(0, 4); // Ensure max 4

      return {
        summary: parsedResult.summary,
        articles:
          selectedArticles.length > 0
            ? selectedArticles
            : candidateItems.slice(0, 4),
      };
    } catch (error) {
      console.error('Error fetching news:', error);
      throw new Error('Failed to fetch news');
    }
  }
}
